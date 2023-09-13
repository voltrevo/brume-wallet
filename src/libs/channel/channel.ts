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

  readonly clean: () => void

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

  [Symbol.dispose]() {
    this.clean()
  }

  async runPingLoop() {
    while (true) {
      const result = await this.tryRequestOrSignal({
        method: "brume_ping"
      }, AbortSignal.timeout(1000))

      if (result.isErr()) {
        console.error(result)
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

    return new Err(new Error(`Unhandled JSON-RPC request ${JSON.stringify(request)}`))
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    if (request.method !== "brume_ping")
      console.log(this.name, "->", request)

    const result = await this.tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)

    if (request.method !== "brume_ping")
      console.log(this.name, "<-", response)

    this.port.postMessage(JSON.stringify(response))
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    const returned = await this.events.emit("response", [response])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled JSON-RPC response ${JSON.stringify(response)}`))
  }

  async onMessage(message: MessageEvent<string>) {
    const data = JSON.parse(message.data) as RpcRequestInit<unknown> | RpcResponseInit<unknown>

    if ("method" in data)
      return await this.onRequest(data)
    return await this.onResponse(data)
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    const request = this.client.prepare(init)

    this.port.postMessage(JSON.stringify(request))

    return Plume.tryWaitOrCloseOrError(this.events, "response", (future: Future<Ok<RpcResponse<T>>>, init: RpcResponseInit<any>) => {
      if (init.id !== request.id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(new Ok(response))
      return new Some(undefined)
    })
  }

  async tryRequestOrSignal<T>(init: RpcRequestPreinit<unknown>, signal: AbortSignal): Promise<Result<RpcResponse<T>, Error>> {
    const request = this.client.prepare(init)

    this.port.postMessage(JSON.stringify(request))

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

  readonly clean: () => void

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

  [Symbol.dispose]() {
    this.clean()
  }

  async tryRouteRequest(request: RpcRequestInit<unknown>) {
    if (request.method === "brume_ping")
      return Ok.void()

    const returned = await this.events.emit("request", [request])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled JSON-RPC request ${JSON.stringify(request)}`))
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    if (request.method !== "brume_ping")
      console.log(this.name, "->", request)

    const result = await this.tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)

    if (request.method !== "brume_ping")
      console.log(this.name, "<-", response)

    tryBrowserSync(() => {
      this.port.postMessage(JSON.stringify(response))
    }).ignore()
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    const returned = await this.events.emit("response", [response])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled JSON-RPC response ${JSON.stringify(response)}`))
  }

  async onMessage(message: string) {
    const data = JSON.parse(message) as RpcRequestInit<unknown> | RpcResponseInit<unknown>

    if ("method" in data)
      return await this.onRequest(data)
    return await this.onResponse(data)
  }

  async onDisconnect() {
    await this.events.emit("close", [undefined])
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const request = this.client.prepare(init)

      tryBrowserSync(() => {
        this.port.postMessage(JSON.stringify(request))
      }).throw(t)

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