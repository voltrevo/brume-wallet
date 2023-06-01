import { Objects } from "@/libs/objects/objects"
import { Rpc } from "@/libs/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Sockets } from "@/libs/sockets/sockets"
import { useSessionsPool } from "@/mods/tor/sessions/context"
import { BinaryError } from "@hazae41/binary"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { ControllerError } from "@hazae41/cascade"
import { Cleaner } from "@hazae41/cleaner"
import { Circuit, TooManyRetriesError } from "@hazae41/echalote"
import { Fleche } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { Pool } from "@hazae41/piscine"
import { AbortError, CloseError, ErrorError } from "@hazae41/plume"
import { Err, Ok, Result } from "@hazae41/result"
import { Fetched, getSchema, useOnce, useSchema } from "@hazae41/xswr"

export type EthereumChainID = number

export type EthereumChains<T = EthereumChain> = {
  [chainId: EthereumChainID]: T
}

export interface EthereumChain {
  id: EthereumChainID,
  url: string,
  etherscan: string
}

export type EthereumSession =
  | EthereumSocket

export function getEthereumHandle(uuid: string, pool?: Mutex<Pool<EthereumHandle, Error>>) {
  if (!pool) return

  return getSchema<EthereumHandle>(`sessions/${uuid}`, async () => {
    return Fetched
      .rewrap(await Pool.takeCryptoRandom(pool))
      .mapSync(r => r.result.get())
  }, {})
}

export function useEthereumHandle(uuid: string) {
  const pool = useSessionsPool()

  const query = useSchema(getEthereumHandle, [uuid, pool])
  useOnce(query)
  return query.data
}

export interface EthereumHandle {
  circuit: Circuit,
  sessions: EthereumChains<EthereumSession>
}

export interface EthereumSocket {
  chain: EthereumChain
  circuit: Circuit,
  socket: Pool<WebSocket, Error>
  client: Rpc.Client
}

export namespace EthereumSocket {

  /**
   * Create a WebSocket session, and destroy the circuit when it closes
   * @param chain 
   * @param circuit 
   * @param signal 
   * @returns 
   */
  export async function tryCreate(circuit: Circuit, chain: EthereumChain, signal?: AbortSignal): Promise<Result<WebSocket, BinaryError | ErrorError | CloseError | AbortError | ControllerError>> {
    return await Result.unthrow(async t => {
      const signal2 = AbortSignals.timeout(5_000, signal)

      const url = new URL(chain.url)

      const tcp = await circuit.tryOpen(url.hostname, 443).then(r => r.throw(t))
      const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384] })
      const socket = new Fleche.WebSocket(url, undefined, { subduplex: tls })

      await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

      return new Ok(socket)
    })
  }

  export async function tryCreateLoop(circuit: Circuit, chain: EthereumChain, signal?: AbortSignal): Promise<Result<WebSocket, TooManyRetriesError | BinaryError | ErrorError | CloseError | AbortError | ControllerError>> {
    for (let i = 0; !signal?.aborted && i < 3; i++) {
      const result = await tryCreate(circuit, chain, signal)

      if (result.isOk())
        return new Ok(result.get())

      if (!circuit.destroyed) {
        console.warn(`EthereumSocketSession.tryCreate failed`, { e: result.get() })
        await new Promise(ok => setTimeout(ok, 1000 * (2 ** i)))
        continue
      }

      return result
    }

    if (signal?.aborted)
      return new Err(AbortError.from(signal.reason))
    return new Err(new TooManyRetriesError())
  }

  export function createUnipool(circuit: Circuit, chain: EthereumChain, signal?: AbortSignal) {
    return new Pool<WebSocket, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index, signal } = params

        const socket = await tryCreateLoop(circuit, chain, signal).then(r => r.throw(t))

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
    }, { capacity: 1, signal })
  }

}

/**
 * Create a pool where each element is a **map** of chainId to Ethereum sessions (on the same circuit), where each session corresponds to an Ethereum chain
 * @param chains 
 * @param circuits 
 * @returns 
 */
export function createEthereumHandlePool(chains: EthereumChains, circuits: Mutex<Pool<Circuit, Error>>) {
  const { capacity, signal } = circuits.inner

  return new Mutex(new Pool<EthereumHandle, Error>(async (params) => {
    return await Result.unthrow(async t => {
      const { pool, index, signal } = params

      const circuit = await Pool.takeCryptoRandom(circuits).then(r => r.throw(t).result.get())

      const sessions = Objects.mapValuesSync(chains, chain => {
        const socket = EthereumSocket.createUnipool(circuit, chain, signal)
        const client = new Rpc.Client()

        return { chain, circuit, socket, client }
      })

      const onCloseOrError = async (reason?: unknown) => {
        pool.delete(index)
        return Ok.void()
      }

      circuit.events.on("close", onCloseOrError, { passive: true })
      circuit.events.on("error", onCloseOrError, { passive: true })

      const onClean = () => {
        circuit.events.off("close", onCloseOrError)
        circuit.events.off("error", onCloseOrError)
      }

      return new Ok(new Cleaner({ circuit, sessions }, onClean))
    })
  }, { capacity, signal }))
}
