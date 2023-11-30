import { Chains } from "@/libs/ethereum/mods/chain"
import { Objects } from "@/libs/objects/objects"
import { Results } from "@/libs/results/results"
import { AbortSignals } from "@/libs/signals/signals"
import { Sockets } from "@/libs/sockets/sockets"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { Jwt } from "@/libs/wconn/mods/jwt/jwt"
import { Wc } from "@/libs/wconn/mods/wc/wc"
import { Box } from "@hazae41/box"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Disposer } from "@hazae41/cleaner"
import { Circuit } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Fleche } from "@hazae41/fleche"
import { RpcCounter } from "@hazae41/jsonrpc"
import { Mutex } from "@hazae41/mutex"
import { None } from "@hazae41/option"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Err, Ok, Result } from "@hazae41/result"

export interface WcBrume {
  readonly key: Ed25519.PrivateKey
  readonly circuits: Pool<Circuit>
  readonly sockets: Pool<Pool<WebSocketConnection>>
}

export type EthBrumes = Pool<EthBrume>

export interface EthBrume extends Chains<Pool<Pool<RpcConnection>>> {
  readonly circuits: Pool<Circuit>
}

export type Connection =
  | WebSocketConnection
  | UrlConnection

export class WebSocketConnection {

  #cooldown = Promise.resolve()

  constructor(
    readonly circuit: Circuit,
    readonly socket: WebSocket
  ) { }

  [Symbol.dispose]() {
    this.socket.close()
  }

  get cooldown() {
    const cooldown = this.#cooldown
    this.#cooldown = this.#cooldown.then(() => new Promise<void>(ok => setTimeout(ok, 100)))
    return cooldown
  }

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

  [Symbol.dispose]() { }

  isWebSocket(): false {
    return false
  }

  isURL(): this is UrlConnection {
    return true
  }

}

export namespace WcBrume {

  export async function tryCreate(circuits: Mutex<Pool<Circuit>>, key: Ed25519.PrivateKey): Promise<Result<WcBrume, Error>> {
    return await Result.unthrow(async t => {
      const relay = Wc.RELAY
      const auth = await Jwt.trySign(key, relay).then(r => r.throw(t))
      const projectId = "a6e0e589ca8c0326addb7c877bbb0857"
      const url = `${relay}/?auth=${auth}&projectId=${projectId}`

      const subcircuits = Circuits.createSubpool(circuits, { capacity: 2 })
      const subsockets = WebSocketConnection.createPools(subcircuits, [url])

      return new Ok({ key, circuits: subcircuits, sockets: subsockets })
    })
  }

  export function createPool(circuits: Mutex<Pool<Circuit>>, params: PoolParams) {
    return new Pool<WcBrume>(async (params) => {
      return await Result.unthrow<Result<Disposer<Box<WcBrume>>, Error>>(async t => {
        const key = await Ed25519.get().PrivateKey.tryRandom().then(r => r.throw(t))
        const brume = new Box(await tryCreate(circuits, key).then(r => r.throw(t)))

        /**
         * Wait for at least one ready circuit (or skip if all are errored)
         */
        await brume.inner.circuits.tryGetRandom().then(r => r.ignore())

        /**
         * Wait for at least one ready socket pool (or skip if all are errored)
         */
        await brume.inner.sockets.tryGetRandom().then(r => r.ignore())

        return new Ok(new Disposer(brume, () => { }))
      })
    }, params)
  }
}

export namespace EthBrume {

  export function create(circuits: Mutex<Pool<Circuit>>, chains: Chains): EthBrume {
    const subcircuits = Circuits.createSubpool(circuits, { capacity: 3 })
    const conns = Objects.mapValuesSync(chains, x => RpcCircuits.create(subcircuits, x.urls))

    return { ...conns, circuits: subcircuits }
  }

  export function createPool(circuits: Mutex<Pool<Circuit>>, chains: Chains, params: PoolParams) {
    return new Pool<EthBrume>(async (params) => {
      const brume = new Box(EthBrume.create(circuits, chains))

      /**
       * Wait for at least one ready circuit (or skip if all are errored)
       */
      await brume.inner.circuits.tryGetRandom().then(r => r.ignore())

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

        const ciphers = [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384]
        const tls = new TlsClientDuplex({ ciphers, host_name: url.hostname })

        tcp.outer.readable.pipeTo(tls.inner.writable).catch(() => { })
        tls.inner.readable.pipeTo(tcp.outer.writable).catch(() => { })

        const socket = new Fleche.WebSocket(url)

        tls.outer.readable.pipeTo(socket.inner.writable).catch(() => { })
        socket.inner.readable.pipeTo(tls.outer.writable).catch(() => { })

        await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

        return new Ok(new WebSocketConnection(circuit, socket))
      }

      if (url.protocol === "ws:") {
        const tcp = await circuit.tryOpen(url.hostname, 80).then(r => r.throw(t))
        const socket = new Fleche.WebSocket(url)

        tcp.outer.readable.pipeTo(socket.inner.writable).catch(() => { })
        socket.inner.readable.pipeTo(tcp.outer.writable).catch(() => { })

        await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

        return new Ok(new WebSocketConnection(circuit, socket))
      }

      return new Err(new Error(`Unknown protocol ${url.protocol}`))
    })
  }

  /**
   * Create a pool of ws connections from a circuit and urls
   * @param circuit 
   * @param urls 
   * @returns 
   */
  export function createPool(circuit: Circuit, urls: readonly string[]) {
    return new Pool<WebSocketConnection>(async (params) => {
      return await Result.unthrow<Result<Disposer<Box<WebSocketConnection>>, Error>>(async t => {
        const { pool, index, signal } = params

        const url = new URL(urls[index])
        const raw = await WebSocketConnection.tryCreate(circuit, url, signal).then(r => r.throw(t))

        const onCloseOrError = async () => {
          pool.restart(index)
        }

        raw.socket.addEventListener("close", onCloseOrError, { passive: true })
        raw.socket.addEventListener("error", onCloseOrError, { passive: true })

        const box = new Box(raw)

        const onEntryClean = () => {
          using _ = box

          raw.socket.removeEventListener("close", onCloseOrError)
          raw.socket.removeEventListener("error", onCloseOrError)
        }

        return new Ok(new Disposer(box, onEntryClean))
      })
    }, { capacity: urls.length })
  }

  /**
   * Create a pool of pool of ws connections from a pool of circuits and urls
   * @param subcircuits 
   * @param urls 
   * @returns 
   */
  export function createPools(subcircuits: Pool<Circuit>, urls: readonly string[]) {
    let update = Date.now()

    const pool = new Pool<Pool<WebSocketConnection>>(async (params) => {
      while (true) {
        const start = Date.now()

        const result = await Result.unthrow<Result<Disposer<Box<Pool<WebSocketConnection>>>, Error>>(async t => {
          const { pool, index } = params

          const circuit = await subcircuits.tryGetOrWait(index % subcircuits.capacity).then(r => r.throw(t).throw(t).inner.inner)
          const subpool = new Box(WebSocketConnection.createPool(circuit, urls))

          const onCloseOrError = async (reason?: unknown) => {
            pool.restart(index)
            return new None()
          }

          circuit.events.on("close", onCloseOrError, { passive: true })
          circuit.events.on("error", onCloseOrError, { passive: true })

          const onEntryClean = () => {
            circuit.events.off("close", onCloseOrError)
            circuit.events.off("error", onCloseOrError)
          }

          /**
           * Wait for at least one ready connection (or skip if all are errored)
           */
          await subpool.inner.tryGetRandom().then(r => r.ignore())

          return new Ok(new Disposer(subpool, onEntryClean))
        }).then(Results.log)

        if (result.isOk())
          return result

        if (start < update)
          continue

        return result
      }
    }, { capacity: subcircuits.capacity })

    subcircuits.events.on("started", async () => {
      update = Date.now()

      for (let i = 0; i < pool.capacity; i++) {
        const child = pool.tryGetSync(i)

        if (child.isErr())
          continue

        if (child.inner.isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }, { passive: true })

    return pool
  }

}

export class RpcConnection {

  readonly counter = new RpcCounter()

  constructor(
    readonly connection: Connection
  ) { }

  [Symbol.dispose]() {
    this.connection[Symbol.dispose]()
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
    return new Pool<RpcConnection>(async (params) => {
      return await Result.unthrow<Result<Disposer<Box<RpcConnection>>, Error>>(async t => {
        const { pool, index, signal } = params

        const url = new URL(urls[index])

        if (url.protocol === "http:" || url.protocol === "https:") {
          const box = new Box(new RpcConnection(new UrlConnection(circuit, url)))

          const onEntryClean = () => {
            using _ = box
          }

          return new Ok(new Disposer(box, onEntryClean))
        }

        const raw = await WebSocketConnection.tryCreate(circuit, url, signal).then(r => r.throw(t))
        const box = new Box(new RpcConnection(raw))

        const onCloseOrError = async () => {
          pool.restart(index)
        }

        raw.socket.addEventListener("close", onCloseOrError, { passive: true })
        raw.socket.addEventListener("error", onCloseOrError, { passive: true })

        const onEntryClean = () => {
          using _ = box

          raw.socket.removeEventListener("close", onCloseOrError)
          raw.socket.removeEventListener("error", onCloseOrError)
        }

        return new Ok(new Disposer(box, onEntryClean))
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
  export function create(subcircuits: Pool<Circuit>, urls: readonly string[]) {
    let update = Date.now()

    const pool = new Pool<Pool<RpcConnection>>(async (params) => {
      while (true) {
        const start = Date.now()

        const result = await Result.unthrow<Result<Disposer<Box<Pool<RpcConnection>>>, Error>>(async t => {
          const { pool, index } = params

          const circuit = await subcircuits.tryGetOrWait(index % subcircuits.capacity).then(r => r.throw(t).throw(t).inner.inner)
          const subpool = new Box(RpcConnections.create(circuit, urls))

          const onCloseOrError = async (reason?: unknown) => {
            pool.restart(index)
            return new None()
          }

          circuit.events.on("close", onCloseOrError, { passive: true })
          circuit.events.on("error", onCloseOrError, { passive: true })

          const onEntryClean = () => {
            circuit.events.off("close", onCloseOrError)
            circuit.events.off("error", onCloseOrError)
          }

          /**
           * Wait for at least one ready connection (or skip if all are errored)
           */
          await subpool.inner.tryGetRandom().then(r => r.ignore())

          return new Ok(new Disposer(subpool, onEntryClean))
        }).then(Results.log)

        if (result.isOk())
          return result

        if (start < update)
          continue

        return result
      }
    }, { capacity: subcircuits.capacity })

    subcircuits.events.on("started", async () => {
      update = Date.now()

      for (let i = 0; i < pool.capacity; i++) {
        const child = pool.tryGetSync(i)

        if (child.isErr())
          continue

        if (child.inner.isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }, { passive: true })

    return pool
  }

}