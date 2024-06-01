import { Future } from "@hazae41/future"
import { RpcCounter, RpcInternalError, RpcInvalidRequestError, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { None, Some } from "@hazae41/option"
import { CloseEvents, ErrorEvents, Plume, SuperEventTarget } from "@hazae41/plume"
import { Err, Ok, Result } from "@hazae41/result"
import { Signals } from "@hazae41/signals"
import { BrowserError } from "../browser/browser"
import { Console } from "../console"
import { AbortSignals } from "../signals/signals"
import { randomUUID } from "../uuid/uuid"

export type RpcRouter =
  | MessageRpcRouter
  | ExtensionRpcRouter

export class MessageRpcRouter {
  readonly counter = new RpcCounter()
  readonly uuid = randomUUID()

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
      try {
        await new Promise(ok => setTimeout(ok, 1000))

        await this.requestOrThrow({
          id: "ping",
          method: "brume_ping"
        }, AbortSignal.timeout(1000)).then(r => r.unwrap())

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

  async tryRouteRequest(request: RpcRequestInit<unknown>) {
    try {
      const returned = await this.events.emit("request", request)

      if (returned.isSome())
        return returned.inner

      if (request.method === "brume_hello")
        return Ok.void()
      if (request.method === "brume_ping")
        return Ok.void()

      return new Err(new RpcInvalidRequestError())
    } catch (e: unknown) {
      return new Err(new RpcInternalError())
    }
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    if (request.id !== "ping")
      Console.debug(this.name, "->", request)

    const result = await this.tryRouteRequest(request)
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

    return new Err(new Error(`Unhandled JSON-RPC response ${JSON.stringify(response)}`))
  }

  async onMessage(message: MessageEvent<string>) {
    const data = JSON.parse(message.data) as RpcRequestInit<unknown> | RpcResponseInit<unknown>

    if ("method" in data)
      return await this.onRequest(data)
    return await this.onResponse(data)
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>, signal = AbortSignals.never()): Promise<Result<RpcResponse<T>, Error>> {
    return Result.runAndDoubleWrap(() => this.requestOrThrow<T>(init, signal))
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>, signal = AbortSignals.never()): Promise<RpcResponse<T>> {
    const request = this.counter.prepare(init)

    if (request.id !== "ping")
      Console.debug(this.name, "<-", request)

    this.port.postMessage(JSON.stringify(request))

    return Plume.waitOrCloseOrErrorOrSignal(this.events, "response", (future: Future<RpcResponse<T>>, init: RpcResponseInit<any>) => {
      if (init.id !== request.id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(response)
      return new Some(undefined)
    }, signal)
  }

  async waitHelloOrThrow(signal = AbortSignals.never()) {
    const active = this.requestOrThrow<void>({ method: "brume_hello" }).then(r => r.unwrap())

    using passive = this.events.wait("request", (future: Future<void>, init) => {
      if (init.method !== "brume_hello")
        return new None()

      future.resolve()
      return new Some(Ok.void())
    })

    using abort = Signals.rejectOnAbort(signal)

    return await Promise.race([active, passive.get(), abort.get()])
  }

}

export class ExtensionRpcRouter {
  readonly counter = new RpcCounter()
  readonly uuid = randomUUID()

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
      const returned = await this.events.emit("request", request)

      if (returned.isSome())
        return returned.inner

      if (request.method === "brume_hello")
        return Ok.void()
      if (request.method === "brume_ping")
        return Ok.void()

      return new Err(new RpcInvalidRequestError())
    } catch (e: unknown) {
      return new Err(new RpcInternalError())
    }
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    if (request.id !== "ping")
      Console.debug(this.name, "->", request)

    const result = await this.tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)

    if (request.id !== "ping")
      Console.debug(this.name, "<-", response)

    BrowserError.tryRunSync(() => {
      this.port.postMessage(JSON.stringify(response))
    }).ignore()
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    if (response.id !== "ping")
      Console.debug(this.name, "->", response)

    const returned = await this.events.emit("response", response)

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
    return Result.runAndDoubleWrap(() => this.requestOrThrow<T>(init))
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>, signal = AbortSignals.never()): Promise<RpcResponse<T>> {
    const request = this.counter.prepare(init)

    if (request.id !== "ping")
      Console.debug(this.name, "<-", request)

    BrowserError.runOrThrowSync(() => this.port.postMessage(JSON.stringify(request)))

    return Plume.waitOrCloseOrErrorOrSignal(this.events, "response", (future: Future<RpcResponse<T>>, init: RpcResponseInit<any>) => {
      if (init.id !== request.id)
        return new None()
      const response = RpcResponse.from<T>(init)
      future.resolve(response)
      return new Some(undefined)
    }, signal)
  }

  async waitHelloOrThrow(signal = AbortSignals.never()) {
    const active = this.requestOrThrow<void>({ method: "brume_hello" }).then(r => r.unwrap())

    using passive = this.events.wait("request", (future: Future<void>, init) => {
      if (init.method !== "brume_hello")
        return new None()

      future.resolve()
      return new Some(Ok.void())
    })

    using abort = Signals.rejectOnAbort(signal)

    return await Promise.race([active, passive.get(), abort.get()])
  }

}