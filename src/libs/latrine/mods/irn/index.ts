import { RpcError, RpcInvalidRequestError, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { CloseEvents, ErrorEvents, SuperEventTarget } from "@hazae41/plume"
import { Err, Ok } from "@hazae41/result"
import { SafeJson } from "../../libs/json"
import { SafeRpc } from "../../libs/rpc/rpc"

export interface IrnPublishPayload {
  readonly topic: string
  readonly message: string
  readonly prompt: boolean
  readonly tag: number
  readonly ttl: number
}

export interface IrnSubscriptionPayload {
  readonly id: string
  readonly data: IrnSubscriptionPayloadData
}

export interface IrnSubscriptionPayloadData {
  readonly topic: string
  readonly message: string
  readonly publishedAt: number
  readonly tag: number
}

export type IrnEvents = CloseEvents & ErrorEvents & {
  request: (request: RpcRequestPreinit<unknown>) => unknown
}

export interface IrnLike {
  readonly events: SuperEventTarget<IrnEvents>

  subscribeOrThrow(topic: string, signal?: AbortSignal): Promise<string>

  publishOrThrow(payload: IrnPublishPayload, signal?: AbortSignal): Promise<void>

  closeOrThrow(reason: unknown): Promise<void>
}

export class IrnClient implements IrnLike {

  readonly topicBySubscription = new Map<string, string>()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    request: (request: RpcRequestPreinit<unknown>) => unknown
  }>()

  #closed?: { reason: unknown }

  constructor(
    readonly socket: WebSocket
  ) {
    socket.addEventListener("message", this.#onMessage.bind(this), { passive: true })
    socket.addEventListener("close", this.#onClose.bind(this), { passive: true })
    socket.addEventListener("error", this.#onError.bind(this), { passive: true })
  }

  [Symbol.dispose]() {
    this.closeOrThrow(undefined).catch(console.error)
  }

  get closed() {
    return this.#closed
  }

  #onClose(event: CloseEvent) {
    this.events.emit("close", [event.reason]).catch(console.error)
  }

  #onError(event: Event) {
    this.events.emit("error", [undefined]).catch(console.error)
  }

  #onMessage(event: MessageEvent<unknown>) {
    if (typeof event.data !== "string")
      return
    const json = JSON.parse(event.data) as RpcRequestInit<unknown> | RpcResponseInit<unknown>

    if ("method" in json)
      return void this.#onRequest(json).catch(console.error)
    return
  }

  async #onRequest(request: RpcRequestInit<unknown>) {
    const result = await this.#routeAndWrap(request)
    const response = RpcResponse.rewrap(request.id, result)
    this.socket.send(SafeJson.stringify(response))
  }

  async #routeAndWrap(request: RpcRequestPreinit<unknown>) {
    try {
      const returned = await this.events.emit("request", request)

      if (returned.isSome())
        return new Ok(returned.inner)

      return new Err(new RpcInvalidRequestError())
    } catch (e: unknown) {
      return new Err(RpcError.rewrap(e))
    }
  }

  async subscribeOrThrow(topic: string, signal = new AbortController().signal): Promise<string> {
    const subscription = await SafeRpc.requestOrThrow<string>(this.socket, {
      method: "irn_subscribe",
      params: { topic }
    }, signal).then(r => r.unwrap())

    this.topicBySubscription.set(subscription, topic)

    return subscription
  }

  async publishOrThrow(payload: IrnPublishPayload, signal = new AbortController().signal): Promise<void> {
    const result = await SafeRpc.requestOrThrow<boolean>(this.socket, {
      method: "irn_publish",
      params: payload
    }, signal).then(r => r.unwrap())

    if (!result)
      throw new Error("Failed to publish")

    return
  }

  async closeOrThrow(reason: unknown): Promise<void> {
    this.#closed = { reason }
    this.socket.close()
  }

}