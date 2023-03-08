import { Arrays } from "@/libs/arrays/arrays"
import { AsyncEventTarget } from "@/libs/events/target"
import { CircuitPool } from "@hazae41/echalote"
import { PoolEvents } from "../pool"
import { createSession, Session } from "./session"

export class SessionPool {

  readonly events = new AsyncEventTarget<PoolEvents<Session>>()

  readonly #allSockets: Session[]
  readonly #allPromises: Promise<Session>[]

  readonly #openSockets = new Set<Session>()

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

    const element = await createSession(this.url, circuit, signal)

    this.#allSockets[index] = element
    this.#openSockets.add(element)

    const onSocketCloseOrError = () => {
      delete this.#allSockets[index]
      this.#openSockets.delete(element)

      element.socket.removeEventListener("close", onSocketCloseOrError)
      element.socket.removeEventListener("error", onSocketCloseOrError)

      this.#start(index)
    }

    element.socket.addEventListener("close", onSocketCloseOrError)
    element.socket.addEventListener("error", onSocketCloseOrError)

    const event = new MessageEvent("socket", { data: { index, element } })
    await this.events.dispatchEvent(event, "element")

    return element
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