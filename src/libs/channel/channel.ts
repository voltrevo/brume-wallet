import { Cleanup } from "@hazae41/cleaner"
import { Future } from "@hazae41/future"
import { None, Some } from "@hazae41/option"
import { CloseEvents, ErrorEvents, Plume, SuperEventTarget } from "@hazae41/plume"
import { Err, Ok, Result } from "@hazae41/result"
import { tryBrowserSync } from "../browser/browser"
import { RpcClient, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "../rpc"

export type Port =
  | WebsitePort
  | ExtensionPort

export class WebsitePort {
  readonly client = new RpcClient()
  readonly uuid = crypto.randomUUID()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    "request": (request: RpcRequestInit<unknown>) => Result<unknown, Error>
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  readonly clean: Cleanup

  constructor(
    readonly name: string,
    readonly port: MessagePort
  ) {
    const onMessage = this.onMessage.bind(this)

    this.port.addEventListener("message", onMessage, { passive: true })

    this.clean = () => {
      this.port.removeEventListener("message", onMessage)
    }
  }

  async runPingLoop() {
    while (true) {
      const result = await this.tryRequestOrSignal({
        method: "brume_ping"
      }, AbortSignal.timeout(1000))

      if (result.isErr()) {
        await this.events.emit("close", [undefined])
        return
      }

      await new Promise(ok => setTimeout(ok, 1000))
    }
  }

  async tryRouteRequest(request: RpcRequestInit<unknown>) {
    if (request.method === "brume_ping")
      return Ok.void()

    const returned = await this.events.emit("request", [request])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled JSON-RPC request ${request}`))
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    console.log(this.name, "->", request)
    const result = await this.tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)
    console.log(this.name, "<-", response)

    this.port.postMessage(response)
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    const returned = await this.events.emit("response", [response])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled JSON-RPC response ${response}`))
  }

  async onMessage(message: MessageEvent<RpcRequestInit<unknown> | RpcResponseInit<unknown>>) {
    if ("method" in message.data)
      return await this.onRequest(message.data)
    return await this.onResponse(message.data)
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    const request = this.client.create(init)

    this.port.postMessage(request)

    return Plume.tryWaitOrCloseOrError(this.events, "response", (future: Future<Ok<RpcResponse<T>>>, init: RpcResponseInit<any>) => {
      if (init.id !== request.id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(new Ok(response))
      return new Some(undefined)
    })
  }

  async tryRequestOrSignal<T>(init: RpcRequestPreinit<unknown>, signal: AbortSignal): Promise<Result<RpcResponse<T>, Error>> {
    const request = this.client.create(init)

    this.port.postMessage(request)

    return Plume.tryWaitOrCloseOrErrorOrSignal(this.events, "response", (future: Future<Ok<RpcResponse<T>>>, init: RpcResponseInit<any>) => {
      if (init.id !== request.id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(new Ok(response))
      return new Some(undefined)
    }, signal)
  }

}

export class ExtensionPort {
  readonly client = new RpcClient()
  readonly uuid = crypto.randomUUID()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    "request": (request: RpcRequestInit<unknown>) => Result<unknown, Error>
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  readonly clean: Cleanup

  constructor(
    readonly name: string,
    readonly port: chrome.runtime.Port
  ) {
    const onMessage = this.onMessage.bind(this)
    const onDisconnect = this.onDisconnect.bind(this)

    this.port.onMessage.addListener(onMessage)
    this.port.onDisconnect.addListener(onDisconnect)

    this.clean = () => {
      this.port.onMessage.removeListener(onMessage)
      this.port.onDisconnect.removeListener(onDisconnect)
    }
  }

  async tryRouteRequest(request: RpcRequestInit<unknown>) {
    if (request.method === "brume_ping")
      return Ok.void()

    const returned = await this.events.emit("request", [request])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled JSON-RPC request ${request}`))
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    console.log(this.name, "->", request)
    const result = await this.tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)
    console.log(this.name, "<-", response)

    tryBrowserSync(() => this.port.postMessage(response)).ignore()
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    const returned = await this.events.emit("response", [response])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled JSON-RPC response ${response}`))
  }

  async onMessage(message: RpcRequestInit<unknown> | RpcResponseInit<unknown>) {
    if ("method" in message)
      return await this.onRequest(message)
    return await this.onResponse(message)
  }

  async onDisconnect() {
    await this.events.emit("close", [undefined])
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const request = this.client.create(init)

      tryBrowserSync(() => this.port.postMessage(request)).throw(t)

      return Plume.tryWaitOrCloseOrError(this.events, "response", (future: Future<Ok<RpcResponse<T>>>, init: RpcResponseInit<any>) => {
        if (init.id !== request.id)
          return new None()

        const response = RpcResponse.from<T>(init)
        future.resolve(new Ok(response))
        return new Some(undefined)
      })
    })
  }

}