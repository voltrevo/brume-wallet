import { RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc";
import { SafeJson } from "@/libs/wconn/mods/json/json";
import { SuperEventTarget } from "@hazae41/plume";
import { Err, Ok, Result } from "@hazae41/result";
import { SafeRpc } from "../rpc/rpc";

export interface IrnSubscriptionPayload {
  readonly id: string
  readonly data: {
    readonly topic: string
    readonly message: string
    readonly publishedAt: number
    readonly tag: number
  }
}

export interface IrnPublishPayload {
  readonly topic: string
  readonly message: string
  readonly prompt: boolean
  readonly tag: number
  readonly ttl: number
}

export class IrnClient {

  readonly topicBySubscription = new Map<string, string>()

  readonly events = new SuperEventTarget<{
    request: (request: RpcRequestPreinit<unknown>) => Result<unknown, Error>
  }>()

  constructor(
    readonly socket: WebSocket
  ) {
    socket.addEventListener("message", this.#onMessage.bind(this))
  }

  #onMessage(event: MessageEvent<unknown>) {
    if (typeof event.data !== "string")
      return
    const json = JSON.parse(event.data) as RpcRequestInit<unknown> | RpcResponseInit<unknown>

    if ("method" in json)
      return this.#onRequest(json)
    return
  }

  async #onRequest(request: RpcRequestInit<unknown>) {
    const result = await this.#tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)
    this.socket.send(SafeJson.stringify(response))
  }

  async #tryRouteRequest(request: RpcRequestPreinit<unknown>) {
    const returned = await this.events.emit("request", [request])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled`))
  }

  async trySubscribe(topic: string): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const subscription = await SafeRpc.tryRequest<string>(this.socket, {
        method: "irn_subscribe",
        params: { topic }
      }, AbortSignal.timeout(5000)).then(r => r.throw(t).throw(t))

      this.topicBySubscription.set(subscription, topic)

      return new Ok(subscription)
    })
  }

  async tryPublish(payload: IrnPublishPayload): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const result = await SafeRpc.tryRequest<boolean>(this.socket, {
        method: "irn_publish",
        params: payload
      }, AbortSignal.timeout(5000)).then(r => r.throw(t).throw(t))

      return Result.assert(result)
    })
  }

}