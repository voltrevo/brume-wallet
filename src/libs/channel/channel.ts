import { Future } from "@hazae41/future"
import { RpcCounter, RpcInternalError, RpcInvalidRequestError, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { None, Some } from "@hazae41/option"
import { CloseEvents, ErrorEvents, Plume, SuperEventTarget } from "@hazae41/plume"
import { Err, Ok, Result } from "@hazae41/result"
import { tryBrowserSync } from "../browser/browser"

export type Port =
  | WebsitePort
  | ExtensionPort

export class WebsitePort {
  readonly counter = new RpcCounter()
  readonly uuid = crypto.randomUUID()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    "request": (request: RpcRequestInit<unknown>) => Result<unknown, Error>
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  #clean: () => void

  constructor(
    readonly name: string,
    readonly port: MessagePort
  ) {
    const onMessage = this.onMessage.bind(this)

    this.port.addEventListener("message", onMessage, { passive: true })

    this.#clean = () => {
      this.port.removeEventListener("message", onMessage)

      this.#clean = () => { }
    }
  }

  [Symbol.dispose]() {
    this.#clean()
  }

  async runPingLoop() {
    let count = 0

    while (true) {
      await new Promise(ok => setTimeout(ok, 1000))

      const signal = AbortSignal.timeout(1000)
      const result = await this.tryPingOrSignal(signal).then(r => r.flatten())

      if (result.isErr())
        count++
      else
        count = 0

      if (count === 2) {
        await this.events.emit("close", [undefined])
        return
      }
    }
  }

  async tryRouteRequest(request: RpcRequestInit<unknown>) {
    try {
      if (request.method === "brume_ping")
        return Ok.void()

      const returned = await this.events.emit("request", [request])

      if (returned.isSome())
        return returned.inner

      return new Err(new RpcInvalidRequestError())
    } catch (e: unknown) {
      return new Err(new RpcInternalError())
    }
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    if (request.id !== "ping")
      console.debug(this.name, "->", request)

    const result = await this.tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)

    if (request.id !== "ping")
      console.debug(this.name, "<-", response, result)

    this.port.postMessage(JSON.stringify(response))
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    if (response.id !== "ping")
      console.debug(this.name, "->", response)

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
    const request = this.counter.prepare(init)

    if (request.id !== "ping")
      console.debug(this.name, "<-", request)

    this.port.postMessage(JSON.stringify(request))

    return Plume.tryWaitOrCloseOrError(this.events, "response", (future: Future<Ok<RpcResponse<T>>>, init: RpcResponseInit<any>) => {
      if (init.id !== request.id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(new Ok(response))
      return new Some(undefined)
    })
  }

  async tryPingOrSignal<T>(signal: AbortSignal): Promise<Result<RpcResponse<T>, Error>> {
    const request = { id: "ping", method: "brume_ping" }

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
  readonly counter = new RpcCounter()
  readonly uuid = crypto.randomUUID()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    "request": (request: RpcRequestInit<unknown>) => Result<unknown, Error>
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  #clean: () => void

  constructor(
    readonly name: string,
    readonly port: chrome.runtime.Port
  ) {
    const onMessage = this.onMessage.bind(this)
    const onDisconnect = this.onDisconnect.bind(this)

    this.port.onMessage.addListener(onMessage)
    this.port.onDisconnect.addListener(onDisconnect)

    this.#clean = () => {
      this.port.onMessage.removeListener(onMessage)
      this.port.onDisconnect.removeListener(onDisconnect)

      this.#clean = () => { }
    }
  }

  [Symbol.dispose]() {
    this.#clean()
  }

  async tryRouteRequest(request: RpcRequestInit<unknown>) {
    try {
      if (request.method === "brume_ping")
        return Ok.void()

      const returned = await this.events.emit("request", [request])

      if (returned.isSome())
        return returned.inner

      return new Err(new RpcInvalidRequestError())
    } catch (e: unknown) {
      return new Err(new RpcInternalError())
    }
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    if (request.id !== "ping")
      console.debug(this.name, "->", request)

    const result = await this.tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)

    if (request.id !== "ping")
      console.debug(this.name, "<-", response)

    tryBrowserSync(() => {
      this.port.postMessage(JSON.stringify(response))
    }).ignore()
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    if (response.id !== "ping")
      console.debug(this.name, "->", response)

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
      const request = this.counter.prepare(init)

      if (request.id !== "ping")
        console.debug(this.name, "<-", request)

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