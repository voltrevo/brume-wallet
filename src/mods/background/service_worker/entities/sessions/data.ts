import { EthereumChain, EthereumChains } from "@/libs/ethereum/chain"
import { Objects } from "@/libs/objects/objects"
import { RpcClient, RpcRequestPreinit } from "@/libs/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Sockets } from "@/libs/sockets/sockets"
import { BinaryError } from "@hazae41/binary"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { ControllerError } from "@hazae41/cascade"
import { Cleaner } from "@hazae41/cleaner"
import { Circuit } from "@hazae41/echalote"
import { Fleche } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { Cancel, Looped, Pool, PoolParams, Retry, tryLoop } from "@hazae41/piscine"
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume"
import { Ok, Result } from "@hazae41/result"
import { FetchError, Fetched, FetcherMore, NormalizerMore, createQuerySchema } from "@hazae41/xswr"

export type Session =
  | SessionRef
  | SessionData

export interface SessionProps {
  readonly session: Session
}

export interface SessionDataProps {
  readonly session: SessionData
}

export interface SessionRef {
  readonly ref: true
  readonly uuid: string
}

export interface SessionData {
  readonly uuid: string
  readonly circuits: Mutex<Pool<CircuitSession, Error>>
}

export interface CircuitSession {
  readonly circuit: Circuit,
  readonly ethereum: EthereumChains<EthereumConnection>
}

export type EthereumConnection =
  | EthereumSocket

export interface EthereumSocket {
  chain: EthereumChain
  circuit: Circuit,
  client: RpcClient
  socket: Pool<WebSocket, Error>
}

export function getSession(uuid: string) {
  return createQuerySchema<string, SessionData, never>(`session/${uuid}`, undefined)
}

export async function getSessionRef(session: Session, more: NormalizerMore) {
  if ("ref" in session) return session

  const schema = getSession(session.uuid)
  await schema?.normalize(session, more)

  return { ref: true, uuid: session.uuid } as SessionRef
}

export namespace EthereumSocket {

  export function create(circuit: Circuit, chain: EthereumChain): EthereumSocket {
    const socket = EthereumSocket.createSocketPool(circuit, chain, { capacity: 1 })
    const client = new RpcClient()

    return { chain, circuit, socket, client }
  }

  export async function tryCreateSocket(circuit: Circuit, chain: EthereumChain, signal?: AbortSignal): Promise<Result<WebSocket, Looped<Error>>> {
    const result = await Result.unthrow<Result<WebSocket, BinaryError | ErroredError | ClosedError | AbortedError | ControllerError>>(async t => {
      const signal2 = AbortSignals.timeout(15_000, signal)

      const url = new URL(chain.url)

      const tcp = await circuit.tryOpen(url.hostname, 443).then(r => r.throw(t))
      const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384] })
      const socket = new Fleche.WebSocket(url, undefined, { subduplex: tls })

      await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

      return new Ok(socket)
    })

    if (circuit.destroyed)
      return result.mapErrSync(Cancel.new)

    return result.mapErrSync(Retry.new)
  }

  export function createSocketPool(circuit: Circuit, chain: EthereumChain, params: PoolParams) {
    return new Pool<WebSocket, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index, signal } = params

        const socket = await tryLoop(async () => {
          return tryCreateSocket(circuit, chain, signal)
        }, { signal }).then(r => r.throw(t))

        const onCloseOrError = () => {
          pool.delete(index)
        }

        socket.addEventListener("close", onCloseOrError, { passive: true })
        socket.addEventListener("error", onCloseOrError, { passive: true })

        const onClean = () => {
          socket.removeEventListener("close", onCloseOrError)
          socket.removeEventListener("error", onCloseOrError)
        }

        return new Ok(new Cleaner(socket, onClean))
      })
    }, params)
  }

  export async function tryFetch(connection: EthereumSocket, init: RpcRequestPreinit<unknown>, more: FetcherMore = {}): Promise<Result<Fetched<string, Error>, FetchError>> {
    return await Result.unthrow<Result<Fetched<string, Error>, Error>>(async t => {
      const { signal = AbortSignals.timeout(15_000) } = more

      console.log(`Fetching ${init.method} with`, connection.circuit.id)

      const socket = await connection.socket.tryGet(0).then(r => r.throw(t))

      const response = await connection.client
        .tryFetchWithSocket<string>(socket, init, signal)
        .then(r => r.throw(t))

      // const body = JSON.stringify({ method: init.method, tor: true })

      // connection.circuit
      //   .tryFetch("http://proxy.brume.money", { method: "POST", body })
      //   .then(r => r.inspectErrSync(console.warn).ignore())

      return new Ok(Fetched.rewrap(response))
    }).then(r => r.mapErrSync(FetchError.from))
  }

}

export namespace CircuitSession {

  export function createPool(chains: EthereumChains, circuits: Mutex<Pool<Circuit, Error>>, params: PoolParams) {
    return new Mutex(new Pool<CircuitSession, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const circuit = await Pool.takeCryptoRandom(circuits).then(r => r.throw(t).result.get())
        const ethereum = Objects.mapValuesSync(chains, chain => EthereumSocket.create(circuit, chain))

        const session: CircuitSession = { circuit, ethereum }

        const onCloseOrError = async (reason?: unknown) => {
          pool.delete(index)
          return Ok.void()
        }

        session.circuit.events.on("close", onCloseOrError, { passive: true })
        session.circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          session.circuit.events.off("close", onCloseOrError)
          session.circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Cleaner(session, onClean))
      })
    }, params))
  }

  export function createSubpool(handles: Mutex<Pool<CircuitSession, Error>>, params: PoolParams) {
    return new Mutex(new Pool<CircuitSession, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const session = await Pool.takeCryptoRandom(handles).then(r => r.throw(t).result.get())

        const onCloseOrError = async (reason?: unknown) => {
          pool.delete(index)
          return Ok.void()
        }

        session.circuit.events.on("close", onCloseOrError, { passive: true })
        session.circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          session.circuit.events.off("close", onCloseOrError)
          session.circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Cleaner(session, onClean))
      })
    }, params))
  }

}