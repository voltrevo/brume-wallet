import { Future } from "@hazae41/future"
import { Guard } from "@hazae41/gardien"
import { RpcCounter, RpcError, RpcInvalidRequestError, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { Some } from "@hazae41/option"
import { CloseEvents, ErrorEvents, Plume, SuperEventTarget } from "@hazae41/plume"
import { Err, Ok, Result } from "@hazae41/result"
import { Signals } from "@hazae41/signals"
import { BrowserError } from "../browser/browser"
import { Console } from "../console"
import { RpcMessageGuard } from "../jsonrpc"
import { randomUUID } from "../uuid/uuid"

export type RpcRouter =
  | MessageRpcRouter
  | ExtensionRpcRouter

export class MessageRpcRouter {
  readonly counter = new RpcCounter()
  readonly uuid = randomUUID()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    "request": (request: RpcRequestInit<unknown>) => unknown
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

    // TODO use AbortController
    while (await new Promise<true>(ok => setTimeout(ok, 1000, true))) {
      try {
        await this.requestOrThrow({
          id: "ping",
          method: "brume_ping"
        }, AbortSignal.timeout(1000)).then(r => r.getOrThrow())

        count = 0
        continue
      } catch (e: unknown) {
        if (count < 2) {
          count++
          continue
        }

        await this.events.emit("close", [undefined])
        return
      }
    }
  }

  async routeAndWrap(request: RpcRequestInit<unknown>) {
    try {
      const returned = await this.events.emit("request", request)

      if (returned.isSome())
        return new Ok(returned.inner)

      if (request.method === "brume_hello")
        return Ok.void()
      if (request.method === "brume_ping")
        return Ok.void()

      return new Err(new RpcInvalidRequestError())
    } catch (e: unknown) {
      console.warn(request.method, e)
      return new Err(RpcError.rewrap(e))
    }
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    if (request.id !== "ping")
      Console.debug(this.name, "->", request)

    const result = await this.routeAndWrap(request)
    const response = RpcResponse.rewrap(request.id, result)

    if (request.id !== "ping")
      Console.debug(this.name, "<-", response, result)

    this.port.postMessage(JSON.stringify(response))
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    if (response.id !== "ping")
      Console.debug(this.name, "->", response)

    const returned = await this.events.emit("response", response)

    if (returned.isSome())
      return returned.inner

    console.warn(`Unhandled response`)
  }

  async onMessage(message: MessageEvent<string>) {
    const data = Guard.asOrThrow(RpcMessageGuard, JSON.parse(message.data) as unknown)

    if ("method" in data)
      return await this.onRequest(data)

    return await this.onResponse(data)
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>, signal = new AbortController().signal): Promise<RpcResponse<T>> {
    const request = this.counter.prepare(init)

    if (request.id !== "ping")
      Console.debug(this.name, "<-", request)

    const promise = Plume.waitWithCloseAndErrorOrThrow(this.events, "response", (future: Future<RpcResponse<T>>, init: RpcResponseInit<any>) => {
      if (init.id !== request.id)
        return
      const response = RpcResponse.from<T>(init)
      future.resolve(response)
      return new Some(undefined)
    }, signal)

    this.port.postMessage(JSON.stringify(request))

    return await promise
  }

  async waitHelloOrThrow(signal = new AbortController().signal) {
    const active = this.requestOrThrow<void>({
      method: "brume_hello"
    }).then(r => r.getOrThrow())

    using request = this.events.wait("request", (future: Future<void>) => future.resolve())
    using response = this.events.wait("response", (future: Future<void>) => future.resolve())

    using abort = Signals.rejectOnAbort(signal)

    return await Promise.race([active, request.get(), response.get(), abort.get()])
  }

}

export class ExtensionRpcRouter {
  readonly counter = new RpcCounter()
  readonly uuid = randomUUID()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    "request": (request: RpcRequestInit<unknown>) => unknown
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

  async routeAndWrap(request: RpcRequestInit<unknown>) {
    try {
      const returned = await this.events.emit("request", request)

      if (returned.isSome())
        return new Ok(returned.inner)

      if (request.method === "brume_hello")
        return Ok.void()
      if (request.method === "brume_ping")
        return Ok.void()

      return new Err(new RpcInvalidRequestError())
    } catch (e: unknown) {
      console.warn(request.method, e)
      return new Err(RpcError.rewrap(e))
    }
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    if (request.id !== "ping")
      Console.debug(this.name, "->", request)

    const result = await this.routeAndWrap(request)
    const response = RpcResponse.rewrap(request.id, result)

    if (request.id !== "ping")
      Console.debug(this.name, "<-", response)

    Result.runAndWrapSync(() => BrowserError.runOrThrowSync(() => this.port.postMessage(JSON.stringify(response))))
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    if (response.id !== "ping")
      Console.debug(this.name, "->", response)

    const returned = await this.events.emit("response", response)

    if (returned.isSome())
      return returned.inner

    console.warn(`Unhandled response`)
  }

  async onMessage(message: string) {
    const data = Guard.asOrThrow(RpcMessageGuard, JSON.parse(message) as unknown)

    if ("method" in data)
      return await this.onRequest(data)

    return await this.onResponse(data)
  }

  async onDisconnect() {
    await this.events.emit("close", [undefined])
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>, signal = new AbortController().signal): Promise<RpcResponse<T>> {
    const request = this.counter.prepare(init)

    if (request.id !== "ping")
      Console.debug(this.name, "<-", request)

    const promise = Plume.waitWithCloseAndErrorOrThrow(this.events, "response", (future: Future<RpcResponse<T>>, init: RpcResponseInit<any>) => {
      if (init.id !== request.id)
        return
      const response = RpcResponse.from<T>(init)
      future.resolve(response)
      return new Some(undefined)
    }, signal)

    BrowserError.runOrThrowSync(() => this.port.postMessage(JSON.stringify(request)))

    return await promise
  }

  async waitHelloOrThrow(signal = new AbortController().signal) {
    const active = this.requestOrThrow<void>({
      method: "brume_hello"
    }).then(r => r.getOrThrow())

    using request = this.events.wait("request", (future: Future<void>) => future.resolve())
    using response = this.events.wait("response", (future: Future<void>) => future.resolve())

    using abort = Signals.rejectOnAbort(signal)

    return await Promise.race([active, request.get(), response.get(), abort.get()])
  }

}