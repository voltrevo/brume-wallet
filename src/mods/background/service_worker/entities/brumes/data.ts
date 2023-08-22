import { EthereumChains } from "@/libs/ethereum/mods/chain"
import { Objects } from "@/libs/objects/objects"
import { RpcClient } from "@/libs/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Sockets } from "@/libs/sockets/sockets"
import { BinaryError } from "@hazae41/binary"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { ControllerError } from "@hazae41/cascade"
import { Cleaner } from "@hazae41/cleaner"
import { Circuit } from "@hazae41/echalote"
import { Fleche } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { None, Optional } from "@hazae41/option"
import { Cancel, Looped, Pool, PoolParams, Retry, tryLoop } from "@hazae41/piscine"
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume"
import { Err, Ok, Panic, Result } from "@hazae41/result"
import { createQuerySchema } from "@hazae41/xswr"
import { Wallet } from "../wallets/data"

export type EthereumBrumes =
  Mutex<Pool<EthereumBrume, Error>>

export interface EthereumBrume {
  readonly circuit: Circuit,
  readonly chains: EthereumChains<Optional<Pool<RpcConnection, Error>>>
}

export type Connection =
  | WebSocketConnection
  | UrlConnection

export interface RpcConnection {
  readonly client: RpcClient
  readonly connection: Connection
}

export class WebSocketConnection {

  constructor(
    readonly socket: WebSocket
  ) { }

  isWebSocket(): this is WebSocketConnection {
    return true
  }

  isURL(): false {
    return false
  }

}

export class UrlConnection {

  constructor(
    readonly url: URL
  ) { }

  isWebSocket(): false {
    return false
  }

  isURL(): this is UrlConnection {
    return true
  }

}

export namespace EthereumBrumes {

  export type Key = ReturnType<typeof key>

  export function key(wallet: Wallet) {
    return `brumes/${wallet.uuid}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(wallet: Wallet) {
    return createQuerySchema<Key, Mutex<Pool<EthereumBrume, Error>>, never>({ key: key(wallet) })
  }

  export function createPool(chains: EthereumChains, circuits: Mutex<Pool<Circuit, Error>>, params: PoolParams) {
    return new Mutex(new Pool<EthereumBrume, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const circuit = await Pool.takeCryptoRandom(circuits).then(r => r.throw(t).result.get())
        const ethereum = Objects.mapValuesSync(chains, chain => Connection.createRpcPool(circuit, chain.urls))

        const brume: EthereumBrume = { circuit, chains: ethereum }

        const onCloseOrError = async (reason?: unknown) => {
          pool.delete(index)
          return new None()
        }

        brume.circuit.events.on("close", onCloseOrError, { passive: true })
        brume.circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          brume.circuit.events.off("close", onCloseOrError)
          brume.circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Cleaner(brume, onClean))
      })
    }, params))
  }

  export function createSubpool(brumes: Mutex<Pool<EthereumBrume, Error>>, params: PoolParams) {
    return new Mutex(new Pool<EthereumBrume, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const brume = await Pool.takeCryptoRandom(brumes).then(r => r.throw(t).result.get())

        const onCloseOrError = async (reason?: unknown) => {
          pool.delete(index)
          return new None()
        }

        brume.circuit.events.on("close", onCloseOrError, { passive: true })
        brume.circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          brume.circuit.events.off("close", onCloseOrError)
          brume.circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Cleaner(brume, onClean))
      })
    }, params))
  }

}

export namespace Connection {

  export async function tryCreate(circuit: Circuit, url: URL, signal?: AbortSignal): Promise<Result<Connection, Looped<Error>>> {
    const result = await Result.unthrow<Result<Connection, BinaryError | ErroredError | ClosedError | AbortedError | ControllerError | Panic>>(async t => {
      const signal2 = AbortSignals.timeout(15_000, signal)

      if (url.protocol === "http:")
        return new Ok(new UrlConnection(url))
      if (url.protocol === "https:")
        return new Ok(new UrlConnection(url))

      if (url.protocol === "wss:") {
        const tcp = await circuit.tryOpen(url.hostname, 443).then(r => r.throw(t))
        const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384] })
        const socket = new Fleche.WebSocket(url, undefined, { subduplex: tls })

        await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

        return new Ok(new WebSocketConnection(socket))
      }

      if (url.protocol === "ws:") {
        const tcp = await circuit.tryOpen(url.hostname, 80).then(r => r.throw(t))
        const socket = new Fleche.WebSocket(url, undefined, { subduplex: tcp })

        await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

        return new Ok(new WebSocketConnection(socket))
      }

      return new Err(new Panic(`Unknown protocol ${url.protocol}`))
    })

    if (result.isErr())
      console.warn(`Could not create ${url.href} using ${circuit.id}`)

    if (circuit.destroyed)
      return result.mapErrSync(Cancel.new)

    return result.mapErrSync(Retry.new)
  }

  export function createPool(circuit: Circuit, urls: readonly string[]) {
    return new Pool<Connection, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index, signal } = params

        const url = new URL(urls[index])

        const connection = await tryLoop(async () => {
          return tryCreate(circuit, url, signal)
        }, { signal }).then(r => r.throw(t))

        if (connection.isURL())
          return new Ok(new Cleaner(connection, () => { }))

        const onCloseOrError = () => {
          pool.delete(index)
        }

        connection.socket.addEventListener("close", onCloseOrError, { passive: true })
        connection.socket.addEventListener("error", onCloseOrError, { passive: true })

        const onClean = () => {
          connection.socket.removeEventListener("close", onCloseOrError)
          connection.socket.removeEventListener("error", onCloseOrError)
        }

        return new Ok(new Cleaner(connection, onClean))
      })
    }, { capacity: urls.length })
  }

  export function createRpcPool(circuit: Circuit, urls: readonly string[]) {
    return new Pool<RpcConnection, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index, signal } = params

        const url = new URL(urls[index])
        const client = new RpcClient()

        const connection = await tryLoop(async () => {
          return tryCreate(circuit, url, signal)
        }, { signal }).then(r => r.throw(t))

        if (connection.isURL())
          return new Ok(new Cleaner({ client, connection }, () => { }))

        const onCloseOrError = () => {
          pool.delete(index)
        }

        connection.socket.addEventListener("close", onCloseOrError, { passive: true })
        connection.socket.addEventListener("error", onCloseOrError, { passive: true })

        const onClean = () => {
          connection.socket.removeEventListener("close", onCloseOrError)
          connection.socket.removeEventListener("error", onCloseOrError)
        }

        return new Ok(new Cleaner({ client, connection }, onClean))
      })
    }, { capacity: urls.length })
  }

}