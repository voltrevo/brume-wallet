import { browser, tryBrowser } from "@/libs/browser/browser"
import { ExtensionPort, Port, WebsitePort } from "@/libs/channel/channel"
import { RpcClient, RpcParamfulRequestPreinit, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { WebAuthnStorage } from "@/libs/webauthn/webauthn"
import { Bytes } from "@hazae41/bytes"
import { Cleaner } from "@hazae41/cleaner"
import { Future } from "@hazae41/future"
import { None, Some } from "@hazae41/option"
import { Cancel, Looped, Pool, Retry, tryLoop } from "@hazae41/piscine"
import { Plume, SuperEventTarget } from "@hazae41/plume"
import { Ok, Panic, Result } from "@hazae41/result"

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

export interface BackgroundHandler {
  onRequest?: (request: RpcRequestInit<unknown>) => void
  onResponse?: (response: RpcResponseInit<unknown>) => void
}

export class WebsitePortAndClient {

  constructor(
    readonly channel: MessageChannel,
    readonly client: RpcClient
  ) { }

}

export function createWebsitePortPool(background: WebsiteBackground): Pool<Port, Error> {
  return new Pool<Port, Error>(async (params) => {
    return await Result.unthrow(async t => {
      const { pool, index } = params

      const registration = await Result
        .catchAndWrap(() => navigator.serviceWorker.ready)
        .then(r => r.throw(t))

      const channel = new MessageChannel()

      const port = new WebsitePort("background", channel.port1)

      channel.port1.start()
      channel.port2.start()

      if (registration.active == null)
        throw new Panic(`registration.active is null`)

      registration.active.postMessage("HELLO_WORLD", [channel.port2])

      await Plume.tryWaitOrSignal(port.events, "request", async (future: Future<Ok<void>>, init: RpcRequestInit<any>) => {
        if (init.method !== "brume_hello")
          return new None()

        future.resolve(Ok.void())
        return new Some(Ok.void())
      }, AbortSignal.timeout(1000)).then(r => r.throw(t))

      port.runPingLoop()

      const uuid = sessionStorage.getItem("uuid")
      const password = sessionStorage.getItem("password")

      if (uuid && password)
        await port.tryRequest({
          method: "brume_setCurrentUser",
          params: [uuid, password]
        }).then(r => r.throw(t))

      const onRequest = (request: RpcRequestInit<unknown>) =>
        background.router.onRequest(port, request)

      const onResponse = (response: RpcResponseInit<unknown>) =>
        background.router.onResponse(port, response)

      port.events.on("request", onRequest, { passive: true })
      port.events.on("response", onResponse, { passive: true })

      const onClose = () => {
        pool.delete(index)
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

      return new Ok(new Cleaner(port, onClean))
    })
  }, { capacity: 1 })
}

export class WebsiteBackground {
  readonly ports = createWebsitePortPool(this)
  readonly router = new BackgroundRouter()

  isWebsite(): this is WebsiteBackground {
    return true
  }

  isExtension(): false {
    return false
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await tryLoop(async () => {
      return await Result.unthrow<Result<RpcResponse<T>, Looped<Error>>>(async t => {
        const port = await this.ports.tryGet(0).then(r => r.mapErrSync(Cancel.new).throw(t))
        const response = await port.tryRequest<T>(init).then(r => r.mapErrSync(Retry.new).throw(t))

        return new Ok(response)
      })
    })
  }

}

export class ExtensionBackground {
  readonly ports = createExtensionChannelPool(this)
  readonly router = new BackgroundRouter()

  isWebsite(): false {
    return false
  }

  isExtension(): this is ExtensionBackground {
    return true
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await tryLoop(async () => {
      return await Result.unthrow<Result<RpcResponse<T>, Looped<Error>>>(async t => {
        const port = await this.ports.tryGet(0).then(r => r.mapErrSync(Cancel.new).throw(t))
        const response = await port.tryRequest<T>(init).then(r => r.mapErrSync(Retry.new).throw(t))

        return new Ok(response)
      })
    })
  }

}

export function createExtensionChannelPool(background: ExtensionBackground): Pool<Port, Error> {
  return new Pool<Port, Error>(async (params) => {
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
        background.router.onRequest(port, request)

      const onResponse = (response: RpcResponseInit<unknown>) =>
        background.router.onResponse(port, response)

      port.events.on("request", onRequest, { passive: true })
      port.events.on("response", onResponse, { passive: true })

      const onClose = () => {
        pool.delete(index)
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

      return new Ok(new Cleaner(port, onClean))
    })
  }, { capacity: 1 })
}

export class BackgroundRouter {
  readonly client = new RpcClient()

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

  async brume_auth_create(request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [name, dataBase64] = (request as RpcParamfulRequestPreinit<[string, string]>).params

      const id = await WebAuthnStorage
        .create(name, Bytes.fromBase64(dataBase64))
        .then(r => r.throw(t))

      return new Ok(Bytes.toBase64(id))
    })
  }

  async brume_auth_get(request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [idBase64] = (request as RpcParamfulRequestPreinit<[string]>).params

      const data = await WebAuthnStorage
        .get(Bytes.fromBase64(idBase64))
        .then(r => r.throw(t))

      return new Ok(Bytes.toBase64(data))
    })
  }

  async onRequest(port: Port, request: RpcRequestInit<unknown>) {
    if (request.method === "brume_auth_create")
      return new Some(await this.brume_auth_create(request))
    if (request.method === "brume_auth_get")
      return new Some(await this.brume_auth_get(request))

    return await this.events.emit("request", [request])
  }

  async onResponse(port: Port, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", [response])
  }

}