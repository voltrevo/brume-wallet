import { browser, tryBrowser } from "@/libs/browser/browser"
import { ExtensionPort, Port, WebsitePort } from "@/libs/channel/channel"
import { RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Disposer } from "@hazae41/cleaner"
import { Future } from "@hazae41/future"
import { None, Some } from "@hazae41/option"
import { Cancel, Looped, Pool, Retry, tryLoop } from "@hazae41/piscine"
import { Plume, SuperEventTarget } from "@hazae41/plume"
import { Err, Ok, Panic, Result } from "@hazae41/result"

export type Background =
  | WebsiteBackground
  | ExtensionBackground

export class MessageError extends Error {
  readonly #class = MessageError
  readonly name = this.#class.name

  constructor() {
    super(`Message error`)
  }

}

export class WebsiteBackground {
  readonly ports = createWebsitePortPool(this)

  readonly events = new SuperEventTarget<{
    "request": (request: RpcRequestInit<unknown>) => Result<unknown, Error>
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  isWebsite(): this is WebsiteBackground {
    return true
  }

  isExtension(): false {
    return false
  }

  async onRequest(port: Port, request: RpcRequestInit<unknown>) {
    return await this.events.emit("request", [request])
  }

  async onResponse(port: Port, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", [response])
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await tryLoop(async () => {
      return await Result.unthrow<Result<RpcResponse<T>, Looped<Error>>>(async t => {
        const port = await this.ports.tryGet(0).then(r => r.mapErrSync(Cancel.new).throw(t).inner)
        const response = await port.tryRequest<T>(init).then(r => r.mapErrSync(Retry.new).throw(t))

        return new Ok(response)
      })
    })
  }

}

export function createWebsitePortPool(background: WebsiteBackground): Pool<Disposer<Port>, Error> {
  return new Pool<Disposer<Port>, Error>(async (params) => {
    return await Result.unthrow(async t => {
      const { pool, index } = params

      const registration = await navigator.serviceWorker.ready

      if (registration.active == null)
        return new Err(new Panic(`Registration is not active`))

      const channel = new MessageChannel()

      const port = new WebsitePort("background", channel.port1)

      channel.port1.start()
      channel.port2.start()

      registration.active.postMessage("HELLO_WORLD", [channel.port2])

      await Plume.tryWaitOrSignal(port.events, "request", async (future: Future<Ok<void>>, init: RpcRequestInit<any>) => {
        if (init.method !== "brume_hello")
          return new None()

        future.resolve(Ok.void())
        return new Some(Ok.void())
      }, AbortSignal.timeout(60_000)).then(r => r.throw(t))

      port.runPingLoop()

      const uuid = sessionStorage.getItem("uuid")
      const password = sessionStorage.getItem("password")

      if (uuid && password)
        await port.tryRequest({
          method: "brume_login",
          params: [uuid, password]
        }).then(r => r.throw(t))

      const onRequest = (request: RpcRequestInit<unknown>) =>
        background.onRequest(port, request)

      const onResponse = (response: RpcResponseInit<unknown>) =>
        background.onResponse(port, response)

      port.events.on("request", onRequest, { passive: true })
      port.events.on("response", onResponse, { passive: true })

      const onClose = async () => {
        await pool.restart(index)
        return new None()
      }

      port.events.on("close", onClose, { passive: true })

      const onClean = () => {
        port.events.off("request", onRequest)
        port.events.off("response", onResponse)
        port.events.off("close", onClose)
        port.clean()
        channel.port1.close()
        channel.port2.close()
      }

      return new Ok(new Disposer(port, onClean))
    })
  }, { capacity: 1 })
}

export class ExtensionBackground {
  readonly ports = createExtensionChannelPool(this)

  readonly events = new SuperEventTarget<{
    "request": (request: RpcRequestInit<unknown>) => Result<unknown, Error>
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  isWebsite(): false {
    return false
  }

  isExtension(): this is ExtensionBackground {
    return true
  }

  async onRequest(port: Port, request: RpcRequestInit<unknown>) {
    return await this.events.emit("request", [request])
  }

  async onResponse(port: Port, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", [response])
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await tryLoop(async () => {
      return await Result.unthrow<Result<RpcResponse<T>, Looped<Error>>>(async t => {
        const port = await this.ports.tryGet(0).then(r => r.mapErrSync(Cancel.new).throw(t).inner)
        const response = await port.tryRequest<T>(init).then(r => r.mapErrSync(Retry.new).throw(t))

        return new Ok(response)
      })
    })
  }

}

export function createExtensionChannelPool(background: ExtensionBackground): Pool<Disposer<Port>, Error> {
  return new Pool<Disposer<Port>, Error>(async (params) => {
    return await Result.unthrow(async t => {
      const { index, pool } = params

      const raw = await tryLoop(async () => {
        return await tryBrowser(async () => {
          const port = browser.runtime.connect({ name: "foreground" })
          port.onDisconnect.addListener(() => void chrome.runtime.lastError)
          return port
        }).then(r => r.mapErrSync(Retry.new))
      }).then(r => r.throw(t))

      const port = new ExtensionPort("background", raw)

      const onRequest = (request: RpcRequestInit<unknown>) =>
        background.onRequest(port, request)

      const onResponse = (response: RpcResponseInit<unknown>) =>
        background.onResponse(port, response)

      port.events.on("request", onRequest, { passive: true })
      port.events.on("response", onResponse, { passive: true })

      const onClose = async () => {
        await pool.restart(index)
        return new None()
      }

      port.events.on("close", onClose, { passive: true })

      const onClean = () => {
        port.events.off("request", onRequest)
        port.events.off("response", onResponse)
        port.events.off("close", onClose)
        port.clean()
        raw.disconnect()
      }

      return new Ok(new Disposer(port, onClean))
    })
  }, { capacity: 1 })
}