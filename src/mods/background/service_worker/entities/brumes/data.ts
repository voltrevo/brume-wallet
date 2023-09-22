import { EthereumChains } from "@/libs/ethereum/mods/chain"
import { Objects } from "@/libs/objects/objects"
import { RpcClient } from "@/libs/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Sockets } from "@/libs/sockets/sockets"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { Jwt } from "@/libs/wconn/mods/jwt/jwt"
import { Wc } from "@/libs/wconn/mods/wc/wc"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Disposer } from "@hazae41/cleaner"
import { Circuit, createPooledCircuitDisposer } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Fleche } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { None } from "@hazae41/option"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Err, Ok, Panic, Result } from "@hazae41/result"

export interface WcBrume {
  readonly key: Ed25519.PrivateKey
  readonly circuits: Pool<Disposer<Circuit>, Error>
  readonly sockets: Pool<Disposer<Pool<Disposer<WebSocketConnection>, Error>>, Error>
}

export type EthBrumes =
  Pool<Disposer<EthBrume>, Error>

export interface EthBrume extends EthereumChains<Pool<Disposer<Pool<Disposer<RpcConnection>, Error>>, Error>> {
  readonly circuits: Pool<Disposer<Circuit>, Error>
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
    readonly circuit: Circuit,
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
    readonly circuit: Circuit,
    readonly url: URL
  ) { }

  isWebSocket(): false {
    return false
  }

  isURL(): this is UrlConnection {
    return true
  }

}

export namespace WcBrume {

  export async function tryCreate(circuits: Mutex<Pool<Disposer<Circuit>, Error>>, key: Ed25519.PrivateKey): Promise<Result<WcBrume, Error>> {
    return await Result.unthrow(async t => {
      const relay = Wc.RELAY
      const auth = await Jwt.trySign(key, relay).then(r => r.throw(t))
      const projectId = "a6e0e589ca8c0326addb7c877bbb0857"
      const url = `${relay}/?auth=${auth}&projectId=${projectId}`

      const subcircuits = Circuits.createSubpool(circuits, { capacity: 3 })
      const sockets = WebSocketConnection.createPools(subcircuits, [url])

      return new Ok({ key, circuits: subcircuits, sockets })
    })
  }

  export function createRandomPool(circuits: Mutex<Pool<Disposer<Circuit>, Error>>, params: PoolParams) {
    return new Pool<Disposer<WcBrume>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const key = await Ed25519.get().PrivateKey.tryRandom().then(r => r.throw(t))
        const brume = await tryCreate(circuits, key).then(r => r.throw(t))

        return new Ok(new Disposer(brume, () => { }))
      })
    })
  }
}


export namespace EthBrume {

  export function create(circuits: Mutex<Pool<Disposer<Circuit>, Error>>, chains: EthereumChains) {
    const subcircuits = Circuits.createSubpool(circuits, { capacity: 3 })
    const conns = Objects.mapValuesSync(chains, x => RpcCircuits.create(subcircuits, x.urls))

    return { ...conns, circuits: subcircuits }
  }

  export function createPool(circuits: Mutex<Pool<Disposer<Circuit>, Error>>, chains: EthereumChains, params: PoolParams) {
    return new Pool<Disposer<EthBrume>, Error>(async (params) => {
      const brume = EthBrume.create(circuits, chains)
      return new Ok(new Disposer(brume, () => { }))
    }, params)
  }

}

export namespace WebSocketConnection {

  /**
   * Create a ws connection from a circuit and an url
   * @param circuit 
   * @param url 
   * @param signal 
   * @returns 
   */
  export async function tryCreate(circuit: Circuit, url: URL, signal?: AbortSignal): Promise<Result<WebSocketConnection, Error>> {
    return await Result.unthrow(async t => {
      const signal2 = AbortSignals.timeout(15_000, signal)

      if (url.protocol === "wss:") {
        const tcp = await circuit.tryOpen(url.hostname, 443).then(r => r.throw(t))
        const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384], host_name: url.hostname })
        const socket = new Fleche.WebSocket(url, undefined, { subduplex: tls })

        await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

        return new Ok(new WebSocketConnection(circuit, socket))
      }

      if (url.protocol === "ws:") {
        const tcp = await circuit.tryOpen(url.hostname, 80).then(r => r.throw(t))
        const socket = new Fleche.WebSocket(url, undefined, { subduplex: tcp })

        await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

        return new Ok(new WebSocketConnection(circuit, socket))
      }

      return new Err(new Panic(`Unknown protocol ${url.protocol}`))
    })
  }

  /**
   * Create a pool of ws connections from a circuit and urls
   * @param circuit 
   * @param urls 
   * @returns 
   */
  export function createPool(circuit: Circuit, urls: readonly string[]) {
    return new Pool<Disposer<WebSocketConnection>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index, signal } = params

        const url = new URL(urls[index])

        const connection = await WebSocketConnection.tryCreate(circuit, url, signal).then(r => r.throw(t))

        const onCloseOrError = async () => {
          await pool.restart(index)
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

  /**
   * Create a pool of pool of ws connections from a pool of circuits and urls
   * @param subcircuits 
   * @param urls 
   * @returns 
   */
  export function createPools(subcircuits: Pool<Disposer<Circuit>, Error>, urls: readonly string[]) {
    return new Pool<Disposer<Pool<Disposer<WebSocketConnection>, Error>>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const circuit = await subcircuits.tryGet(index % subcircuits.capacity).then(r => r.inspectErrSync(() => {
          subcircuits.events.on("started", async i => {
            if (i !== (index % subcircuits.capacity))
              return new None()
            await pool.restart(index)
            return new None()
          }, { passive: true, once: true })
        }).throw(t).inner)

        const connections = WebSocketConnection.createPool(circuit, urls)

        /**
         * Restart this index when the circuit dies
         */
        const { dispose } = createPooledCircuitDisposer(circuit, params)

        return new Ok(new Disposer(connections, dispose))
      })
    }, { capacity: subcircuits.capacity })
  }

}

export namespace RpcConnection {

  export function from(connection: Connection) {
    const client = new RpcClient()
    return { connection, client }
  }

}

export namespace RpcConnections {

  /**
   * Create a pool of rpc connections from a circuit and urls
   * @param circuit 
   * @param urls 
   * @returns 
   */
  export function create(circuit: Circuit, urls: readonly string[]) {
    return new Pool<Disposer<RpcConnection>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index, signal } = params

        const url = new URL(urls[index])

        if (url.protocol === "http:")
          return new Ok(new Disposer(RpcConnection.from(new UrlConnection(circuit, url)), () => { }))
        if (url.protocol === "https:")
          return new Ok(new Disposer(RpcConnection.from(new UrlConnection(circuit, url)), () => { }))

        const connection = await WebSocketConnection.tryCreate(circuit, url, signal).then(r => r.throw(t))

        const onCloseOrError = async () => {
          await pool.restart(index)
        }

        connection.socket.addEventListener("close", onCloseOrError, { passive: true })
        connection.socket.addEventListener("error", onCloseOrError, { passive: true })

        const onClean = () => {
          connection.socket.removeEventListener("close", onCloseOrError)
          connection.socket.removeEventListener("error", onCloseOrError)
        }

        return new Ok(new Disposer(RpcConnection.from(connection), onClean))
      })
    }, { capacity: urls.length })
  }

}

export namespace RpcCircuits {

  /**
   * Create a pool of pool of rpc connections from a pool of circuits and urls
   * @param subcircuits 
   * @param urls 
   * @returns 
   */
  export function create(subcircuits: Pool<Disposer<Circuit>, Error>, urls: readonly string[]) {
    return new Pool<Disposer<Pool<Disposer<RpcConnection>, Error>>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const circuit = await subcircuits.tryGet(index % subcircuits.capacity).then(r => r.inspectErrSync(() => {
          subcircuits.events.on("started", async i => {
            if (i !== (index % subcircuits.capacity))
              return new None()
            await pool.restart(index)
            return new None()
          }, { passive: true, once: true })
        }).throw(t).inner)

        const connections = RpcConnections.create(circuit, urls)

        /**
         * Restart this index when the circuit dies
         */
        const { dispose } = createPooledCircuitDisposer(circuit, params)

        return new Ok(new Disposer(connections, dispose))
      })
    }, { capacity: subcircuits.capacity })
  }

}