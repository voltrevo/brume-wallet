import { EthereumChains } from "@/libs/ethereum/mods/chain"
import { Objects } from "@/libs/objects/objects"
import { RpcClient } from "@/libs/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Sockets } from "@/libs/sockets/sockets"
import { Jwt } from "@/libs/wconn/mods/jwt/jwt"
import { Wc } from "@/libs/wconn/mods/wc/wc"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Disposer } from "@hazae41/cleaner"
import { Circuit } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Fleche } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { None, Optional } from "@hazae41/option"
import { Cancel, Looped, Pool, PoolParams, Retry, tryLoop } from "@hazae41/piscine"
import { Err, Ok, Panic, Result } from "@hazae41/result"
import { createQuerySchema } from "@hazae41/xswr"
import { Wallet } from "../wallets/data"

export type WcBrumes =
  Mutex<Pool<Disposer<WcBrume>, Error>>

export interface WcBrume {
  readonly circuit: Circuit
  readonly sockets: Pool<Disposer<WebSocketConnection>, Error>
}

export type EthBrumes =
  Mutex<Pool<Disposer<EthBrume>, Error>>

export interface EthBrume {
  readonly circuit: Circuit,
  readonly chains: EthereumChains<Optional<Pool<Disposer<RpcConnection>, Error>>>
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

export namespace WcBrumes {

  export async function tryCreate(circuit: Circuit): Promise<Result<WcBrume, Error>> {
    return await Result.unthrow(async t => {
      const relay = Wc.RELAY
      const key = await Ed25519.get().PrivateKey.tryRandom().then(r => r.throw(t))
      const auth = await Jwt.trySign(key, relay).then(r => r.throw(t))
      const projectId = "a6e0e589ca8c0326addb7c877bbb0857"
      const url = `${relay}/?auth=${auth}&projectId=${projectId}`
      const sockets = WebSocketConnection.createPool(circuit, [url])

      return new Ok({ circuit, sockets })
    })
  }

  export async function createPool(circuits: Mutex<Pool<Disposer<Circuit>, Error>>, params: PoolParams) {
    return new Mutex(new Pool<Disposer<WcBrume>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const circuit = await Pool.takeCryptoRandom(circuits).then(r => r.throw(t).result.get().inner)
        const brume = await tryCreate(circuit).then(r => r.throw(t))

        const onCloseOrError = async (reason?: unknown) => {
          pool.restart(index)
          return new None()
        }

        circuit.events.on("close", onCloseOrError, { passive: true })
        circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          circuit.events.off("close", onCloseOrError)
          circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Disposer(brume, onClean))
      })
    }, params))
  }
}

export namespace EthBrumes {

  export type Key = ReturnType<typeof key>

  export function key(wallet: Wallet) {
    return `brumes/${wallet.uuid}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(wallet: Wallet) {
    return createQuerySchema<Key, Mutex<Pool<Disposer<EthBrume>, Error>>, never>({ key: key(wallet) })
  }

  export function createPool(chains: EthereumChains, circuits: Mutex<Pool<Disposer<Circuit>, Error>>, params: PoolParams) {
    return new Mutex(new Pool<Disposer<EthBrume>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const circuit = await Pool.takeCryptoRandom(circuits).then(r => r.throw(t).result.get().inner)
        const chains2 = Objects.mapValuesSync(chains, chain => RpcConnection.createPool(circuit, chain.urls))

        const brume: EthBrume = { circuit, chains: chains2 }

        const onCloseOrError = async (reason?: unknown) => {
          pool.restart(index)
          return new None()
        }

        circuit.events.on("close", onCloseOrError, { passive: true })
        circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          circuit.events.off("close", onCloseOrError)
          circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Disposer(brume, onClean))
      })
    }, params))
  }

  export function createSubpool(brumes: Mutex<Pool<Disposer<EthBrume>, Error>>, params: PoolParams) {
    return new Mutex(new Pool<Disposer<EthBrume>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const brume = await Pool.takeCryptoRandom(brumes).then(r => r.throw(t).result.get().inner)

        const onCloseOrError = async (reason?: unknown) => {
          pool.restart(index)
          return new None()
        }

        brume.circuit.events.on("close", onCloseOrError, { passive: true })
        brume.circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          brume.circuit.events.off("close", onCloseOrError)
          brume.circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Disposer(brume, onClean))
      })
    }, params))
  }

}

export namespace WebSocketConnection {

  export async function tryCreate(circuit: Circuit, url: URL, signal?: AbortSignal): Promise<Result<WebSocketConnection, Error>> {
    return await Result.unthrow(async t => {
      const signal2 = AbortSignals.timeout(15_000, signal)

      if (url.protocol === "wss:") {
        const tcp = await circuit.tryOpen(url.hostname, 443).then(r => r.throw(t))
        const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384], host_name: url.hostname })
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
  }

  export async function tryCreateLooped(circuit: Circuit, url: URL, signal?: AbortSignal): Promise<Result<WebSocketConnection, Looped<Error>>> {
    const result = await tryCreate(circuit, url, signal)

    if (result.isErr())
      console.warn(`Could not create ${url.href} using ${circuit.id}`)

    if (circuit.destroyed)
      return result.mapErrSync(Cancel.new)

    return result.mapErrSync(Retry.new)
  }

  export function createPool(circuit: Circuit, urls: readonly string[]) {
    return new Pool<Disposer<WebSocketConnection>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index, signal } = params

        const url = new URL(urls[index])

        const connection = await tryLoop(async () => {
          return WebSocketConnection.tryCreateLooped(circuit, url, signal)
        }, { signal }).then(r => r.throw(t))

        const onCloseOrError = () => {
          pool.restart(index)
        }

        connection.socket.addEventListener("close", onCloseOrError, { passive: true })
        connection.socket.addEventListener("error", onCloseOrError, { passive: true })

        const onClean = () => {
          connection.socket.removeEventListener("close", onCloseOrError)
          connection.socket.removeEventListener("error", onCloseOrError)
        }

        return new Ok(new Disposer(connection, onClean))
      })
    }, { capacity: urls.length })
  }

}

export namespace RpcConnection {

  export function from(connection: Connection) {
    const client = new RpcClient()
    return { connection, client }
  }

  export function createPool(circuit: Circuit, urls: readonly string[]) {
    return new Pool<Disposer<RpcConnection>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index, signal } = params

        const url = new URL(urls[index])
        const client = new RpcClient()

        if (url.protocol === "http:")
          return new Ok(new Disposer(RpcConnection.from(new UrlConnection(url)), () => { }))
        if (url.protocol === "https:")
          return new Ok(new Disposer(RpcConnection.from(new UrlConnection(url)), () => { }))

        const connection = await tryLoop(async () => {
          return WebSocketConnection.tryCreateLooped(circuit, url, signal)
        }, { signal }).then(r => r.throw(t))

        const onCloseOrError = () => {
          pool.restart(index)
        }

        connection.socket.addEventListener("close", onCloseOrError, { passive: true })
        connection.socket.addEventListener("error", onCloseOrError, { passive: true })

        const onClean = () => {
          connection.socket.removeEventListener("close", onCloseOrError)
          connection.socket.removeEventListener("error", onCloseOrError)
        }

        return new Ok(new Disposer({ client, connection }, onClean))
      })
    }, { capacity: urls.length })
  }

}