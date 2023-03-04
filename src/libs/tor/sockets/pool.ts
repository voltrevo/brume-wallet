import { Arrays } from "@/libs/arrays/arrays"
import { AsyncEventTarget } from "@/libs/events/target"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Circuit, CircuitPool } from "@hazae41/echalote"
import { Fleche } from "@hazae41/fleche"
import { Future } from "@hazae41/future"

export async function createWebSocket(url: URL, circuit: Circuit, signal?: AbortSignal) {
  const tcp = await circuit.open(url.hostname, 443)
  const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384] })
  const socket = new Fleche.WebSocket(url, undefined, { subduplex: tls })

  const future = new Future()

  try {
    socket.addEventListener("open", future.resolve, { passive: true })
    socket.addEventListener("error", future.reject, { passive: true })

    await future.promise
  } finally {
    socket.removeEventListener("open", future.resolve)
    socket.removeEventListener("error", future.reject)
  }

  return socket
}

export interface SocketPoolEntry {
  index: number,
  socket: WebSocket
}

export type SocketPoolEvents = {
  socket: MessageEvent<SocketPoolEntry>
}

export class SocketPool {

  readonly events = new AsyncEventTarget<SocketPoolEvents>()

  readonly #allSockets: WebSocket[]
  readonly #allPromises: Promise<WebSocket>[]

  readonly #openSockets = new Set<WebSocket>()

  constructor(
    readonly url: URL,
    readonly circuits: CircuitPool,
    readonly signal?: AbortSignal
  ) {
    this.#allSockets = new Array(circuits.capacity)
    this.#allPromises = new Array(circuits.capacity)

    for (let index = 0; index < circuits.capacity; index++)
      this.#start(index)
  }

  #start(index: number) {
    const promise = this.#create(index)
    this.#allPromises[index] = promise
    promise.catch(console.warn)
  }

  async #create(index: number) {
    const { signal } = this

    const circuit = await this.circuits.get(index)

    const socket = await createWebSocket(this.url, circuit, signal)

    this.#allSockets[index] = socket
    this.#openSockets.add(socket)

    const onSocketCloseOrError = () => {
      delete this.#allSockets[index]
      this.#openSockets.delete(socket)

      socket.removeEventListener("close", onSocketCloseOrError)
      socket.removeEventListener("error", onSocketCloseOrError)

      this.#start(index)
    }

    socket.addEventListener("close", onSocketCloseOrError)
    socket.addEventListener("error", onSocketCloseOrError)

    const event = new MessageEvent("socket", { data: { index, socket } })
    await this.events.dispatchEvent(event, "socket")

    return socket
  }

  async random() {
    await Promise.any(this.#allPromises)

    return this.randomSync()
  }

  randomSync() {
    const sockets = [...this.#openSockets]
    const socket = Arrays.randomOf(sockets)

    if (!socket)
      throw new Error(`No circuit in pool`)

    return socket
  }

}