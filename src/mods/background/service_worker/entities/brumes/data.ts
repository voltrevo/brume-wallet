import { chainDataByChainId } from "@/libs/ethereum/mods/chain"
import { Objects } from "@/libs/objects/objects"
import { ping } from "@/libs/ping"
import { AutoPool } from "@/libs/pool"
import { Sockets } from "@/libs/sockets/sockets"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { Box, Deferred, Stack } from "@hazae41/box"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Disposer } from "@hazae41/disposer"
import { Circuit } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Fleche } from "@hazae41/fleche"
import { RpcCounter } from "@hazae41/jsonrpc"
import { Jwt, Wc } from "@hazae41/latrine"
import { loopOrThrow, PoolEntry, Retry } from "@hazae41/piscine"
import { Result } from "@hazae41/result"

export interface WcBrume {
  readonly key: Ed25519.SigningKey
  readonly circuits: AutoPool<Circuit>
  readonly sockets: AutoPool<Disposer<AutoPool<WebSocketConnection>>>
}

export type EthBrumes = AutoPool<EthBrume>

export interface EthBrume {
  readonly [chainId: number]: Disposer<AutoPool<Disposer<AutoPool<RpcConnection>>>>
  readonly circuits: AutoPool<Circuit>
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
    try {
      this.socket.close()
    } catch { }
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

  export async function createOrThrow(circuits: AutoPool<Circuit>, key: Ed25519.SigningKey): Promise<WcBrume> {
    const relay = Wc.RELAY
    const auth = await Jwt.signOrThrow(key, relay)
    const projectId = "a6e0e589ca8c0326addb7c877bbb0857"
    const url = `${relay}/?auth=${auth}&projectId=${projectId}`

    const subcircuits = Circuits.createCircuitSubpool(circuits, 2)
    const subsockets = WebSocketConnection.createPools(subcircuits.get(), [url])

    return { key, circuits: subcircuits.get(), sockets: subsockets.get() }
  }

  export function createPool(circuits: AutoPool<Circuit>, size: number) {
    const pool = new AutoPool<WcBrume>(async () => {
      const key = await Ed25519.get().getOrThrow().SigningKey.randomOrThrow()
      const brume = new Box(await createOrThrow(circuits, key))

      /**
       * Wait for at least one ready circuit (or skip if all are errored)
       */
      await Promise.any(brume.getOrThrow().circuits.okPromises).catch(() => { })

      /**
       * Wait for at least one ready socket pool (or skip if all are errored)
       */
      await Promise.any(brume.getOrThrow().sockets.okPromises).catch(() => { })

      return new Disposer(brume, () => { })
    }, size)

    return new Disposer(pool, () => { })
  }
}

export namespace EthBrume {

  export function create(circuits: AutoPool<Circuit>): EthBrume {
    const subcircuits = Circuits.createCircuitSubpool(circuits, 9)

    const chains = Objects.mapValuesSync(chainDataByChainId, (chainData) =>
      RpcCircuits.createRpcCircuitsPool(subcircuits.get(), chainData.urls))

    return { ...chains, circuits: subcircuits.get() } satisfies EthBrume
  }

  export function createPool(circuits: AutoPool<Circuit>, size: number) {
    const pool = new AutoPool<EthBrume>(async (params) => {
      const brume = new Box(EthBrume.create(circuits))

      /**
       * Wait for at least one ready circuit (or skip if all are errored)
       */
      await Promise.any(brume.getOrThrow().circuits.okPromises).catch(() => { })

      return new Disposer(brume, () => { })
    }, size)

    return new Disposer(pool, () => { })
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
  export async function createOrThrow(circuit: Circuit, url: URL, signal = new AbortController().signal): Promise<WebSocketConnection> {
    const signal2 = AbortSignal.any([AbortSignal.timeout(ping.value * 9), signal])

    if (url.protocol === "wss:") {
      const tcp = await circuit.openOrThrow(url.hostname, 443)

      const ciphers = [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384, Ciphers.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384]
      const tls = new TlsClientDuplex({ ciphers, host_name: url.hostname })

      tcp.outer.readable.pipeTo(tls.inner.writable).catch(() => { })
      tls.inner.readable.pipeTo(tcp.outer.writable).catch(() => { })

      const socket = new Fleche.WebSocket(url)

      tls.outer.readable.pipeTo(socket.inner.writable).catch(() => { })
      socket.inner.readable.pipeTo(tls.outer.writable).catch(() => { })

      await Sockets.waitOrThrow(socket, signal2)

      return new WebSocketConnection(circuit, socket)
    }

    if (url.protocol === "ws:") {
      const tcp = await circuit.openOrThrow(url.hostname, 80)
      const socket = new Fleche.WebSocket(url)

      tcp.outer.readable.pipeTo(socket.inner.writable).catch(() => { })
      socket.inner.readable.pipeTo(tcp.outer.writable).catch(() => { })

      await Sockets.waitOrThrow(socket, signal2)

      return new WebSocketConnection(circuit, socket)
    }

    throw new Error(`Unknown protocol ${url.protocol}`)
  }

  /**
   * Create a pool of ws connections from a circuit and urls
   * @param circuit 
   * @param urls 
   * @returns 
   */
  export function createPool(circuit: Circuit, urls: readonly string[]) {
    const pool = new AutoPool<WebSocketConnection>(async (params) => {
      const { index, signal } = params

      using stack = new Box(new Stack())

      const url = new URL(urls[index])
      const raw = await WebSocketConnection.createOrThrow(circuit, url, signal)
      const box = new Box(raw)
      stack.getOrThrow().push(box)

      const onCloseOrError = () => void pool.restart(index)

      raw.socket.addEventListener("close", onCloseOrError, { passive: true })
      stack.getOrThrow().push(new Deferred(() => raw.socket.removeEventListener("close", onCloseOrError)))

      raw.socket.addEventListener("error", onCloseOrError, { passive: true })
      stack.getOrThrow().push(new Deferred(() => raw.socket.removeEventListener("error", onCloseOrError)))

      const unstack = stack.unwrapOrThrow()

      return new Disposer(box, () => unstack[Symbol.dispose]())
    }, urls.length)

    return new Disposer(pool, () => { })
  }

  /**
   * Create a pool of pool of ws connections from a pool of circuits and urls
   * @param subcircuits 
   * @param urls 
   * @returns 
   */
  export function createPools(subcircuits: AutoPool<Circuit>, urls: readonly string[]) {
    let update = Date.now()

    const pool = new AutoPool<Disposer<AutoPool<WebSocketConnection>>>(async (params) => {
      const { index, signal } = params

      while (!signal.aborted) {
        const start = Date.now()

        const result = await Result.runAndWrap(async () => {
          using stack = new Box(new Stack())

          const circuit = await subcircuits.getOrThrow(index % subcircuits.capacity, signal)
          const subpool = new Box(WebSocketConnection.createPool(circuit, urls))
          stack.getOrThrow().push(subpool)

          const onCloseOrError = () => void pool.restart(index)

          stack.getOrThrow().push(new Deferred(circuit.events.on("close", onCloseOrError, { passive: true })))
          stack.getOrThrow().push(new Deferred(circuit.events.on("error", onCloseOrError, { passive: true })))

          /**
           * Wait for at least one ready connection (or skip if all are errored)
           */
          await Promise.any(subpool.getOrThrow().get().okPromises).catch(() => { })

          const unstack = stack.unwrapOrThrow()

          return new Disposer(subpool, () => unstack[Symbol.dispose]())
        })

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }

      throw new Error("Aborted", { cause: signal.reason })
    }, subcircuits.capacity)

    const onStarted = () => {
      update = Date.now()

      for (const entry of pool.errEntries)
        pool.restart(entry.index)

      return
    }

    const stack = new Stack()

    stack.push(new Deferred(subcircuits.events.on("started", onStarted, { passive: true })))

    return new Disposer(pool, () => stack[Symbol.dispose]())
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
   * Create a pool of rpc connections for each url using the given circuit
   * @param circuit 
   * @param urls 
   * @returns 
   */
  export function createRpcConnectionsPool(circuit: Circuit, urls: readonly string[]) {
    const pool = new AutoPool<RpcConnection>(async (params) => {
      const { index, signal } = params

      const url = new URL(urls[index])

      if (url.protocol === "http:" || url.protocol === "https:") {
        using stack = new Box(new Stack())

        const raw = new UrlConnection(circuit, url)
        const box = new Box(new RpcConnection(raw))
        stack.getOrThrow().push(box)

        const unstack = stack.unwrapOrThrow()

        return new Disposer(box, () => unstack[Symbol.dispose]())
      }

      if (url.protocol === "ws:" || url.protocol === "wss:") {
        using stack = new Box(new Stack())

        const raw = await loopOrThrow(async () => {
          try {
            return await WebSocketConnection.createOrThrow(circuit, url, signal)
          } catch (e: unknown) {
            console.log(`Retrying WebSocket connection creation ${url.origin} #${circuit.id}`, { e })
            throw new Retry(e)
          }
        }, { max: 9 })

        const box = new Box(new RpcConnection(raw))
        stack.getOrThrow().push(box)

        const onCloseOrError = () => void pool.restart(index)

        raw.socket.addEventListener("close", onCloseOrError, { passive: true })
        stack.getOrThrow().push(new Deferred(() => raw.socket.removeEventListener("close", onCloseOrError)))

        raw.socket.addEventListener("error", onCloseOrError, { passive: true })
        stack.getOrThrow().push(new Deferred(() => raw.socket.removeEventListener("error", onCloseOrError)))

        const unstack = stack.unwrapOrThrow()

        return new Disposer(box, () => unstack[Symbol.dispose]())
      }

      throw new Error(`Unknown protocol ${url.protocol}`)
    }, urls.length)

    const onCreated = (entry: PoolEntry<RpcConnection>) => {
      if (entry.isOk())
        return
      console.error(`Error creating rpc connection`, entry)
    }

    const stack = new Stack()

    stack.push(new Deferred(pool.events.on("created", onCreated, { passive: true })))

    return new Disposer(pool, () => stack[Symbol.dispose]())
  }

}

export namespace RpcCircuits {

  /**
   * Create a pool of rpc connections for each url and for each circuit
   * @param subcircuits 
   * @param urls 
   * @returns 
   */
  export function createRpcCircuitsPool(subcircuits: AutoPool<Circuit>, urls: readonly string[]) {
    let update = Date.now()

    const pool = new AutoPool<Disposer<AutoPool<RpcConnection>>>(async (params) => {
      const { index, signal } = params

      while (!signal.aborted) {
        const start = Date.now()

        const result = await Result.runAndWrap(async () => {
          using stack = new Box(new Stack())

          const circuit = await subcircuits.getOrThrow(index % subcircuits.capacity, signal)
          const subpool = new Box(RpcConnections.createRpcConnectionsPool(circuit, urls))
          stack.getOrThrow().push(subpool)

          const onCloseOrError = () => void pool.restart(index)

          stack.getOrThrow().push(new Deferred(circuit.events.on("close", onCloseOrError, { passive: true })))
          stack.getOrThrow().push(new Deferred(circuit.events.on("error", onCloseOrError, { passive: true })))

          /**
           * Wait for at least one ready connection (or skip if all are errored)
           */
          await Promise.any(subpool.getOrThrow().get().okPromises).catch(() => { })

          const unstack = stack.unwrapOrThrow()

          return new Disposer(subpool, () => unstack[Symbol.dispose]())
        })

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }

      throw new Error("Aborted", { cause: signal.reason })
    }, subcircuits.capacity)

    const onStarted = () => {
      update = Date.now()

      for (const entry of pool.errEntries)
        pool.restart(entry.index)

      return
    }

    const stack = new Stack()

    stack.push(new Deferred(subcircuits.events.on("started", onStarted, { passive: true })))

    return new Disposer(pool, () => stack[Symbol.dispose]())
  }

}