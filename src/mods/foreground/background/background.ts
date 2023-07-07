import { browser, tryBrowser } from "@/libs/browser/browser"
import { ExtensionPort, Port, WebsitePort } from "@/libs/channel/channel"
import { RpcClient, RpcId, RpcParamfulRequestPreinit, RpcRequest, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Bytes } from "@hazae41/bytes"
import { Cleaner } from "@hazae41/cleaner"
import { Future } from "@hazae41/future"
import { Optional } from "@hazae41/option"
import { Cancel, Looped, Pool, Retry, Skip, tryLoop } from "@hazae41/piscine"
import { SuperEventTarget } from "@hazae41/plume"
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

export interface BackgroundHandler {
  onRequest?: (request: RpcRequestInit<unknown>) => void
  onResponse?: (response: RpcResponseInit<unknown>) => void
}

export class WebsitePortAndClient {

  constructor(
    readonly channel: MessageChannel,
    readonly client: RpcClient
  ) { }

  async tryWait<T>(id: RpcId): Promise<Result<RpcRequest<T>, Error>> {
    const future = new Future<Result<RpcRequest<T>, never>>()

    const onMessage = (event: MessageEvent<RpcRequestInit<T>>) => {
      const response = RpcRequest.from(event.data)

      if (response.id !== id)
        return
      future.resolve(new Ok(response))
    }

    try {
      this.channel.port1.addEventListener("message", onMessage, { passive: true })

      return await future.promise
    } finally {
      this.channel.port1.removeEventListener("message", onMessage)
    }
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, never>> {
    const request = this.client.create(init)

    const future = new Future<Result<RpcResponse<T>, never>>()

    const onMessage = (event: MessageEvent<RpcRequestInit<unknown> | RpcResponseInit<T>>) => {
      if ("method" in event.data)
        return

      const response = RpcResponse.from(event.data)

      if (response.id !== request.id)
        return
      future.resolve(new Ok(response))
    }

    try {
      this.channel.port1.addEventListener("message", onMessage, { passive: true })

      this.channel.port1.postMessage(request)

      return await future.promise
    } finally {
      this.channel.port1.removeEventListener("message", onMessage)
    }
  }
}

export function createWebsitePortPool(background: WebsiteBackground) {
  return new Pool<Port, Error>(async (params) => {
    return await Result.unthrow(async t => {
      const { pool, index } = params

      const registration = await Result
        .catchAndWrap(() => navigator.serviceWorker.ready)
        .then(r => r.throw(t))

      const channel = new MessageChannel()

      const client = new WebsitePortAndClient(channel, background.router.client)

      channel.port1.start()
      channel.port2.start()

      if (registration.active === null)
        throw new Panic(`registration.active is null`)

      registration.active.postMessage("HELLO_WORLD", [channel.port2])

      await client.tryWait("hello").then(r => r.throw(t))

      const uuid = sessionStorage.getItem("uuid")
      const password = sessionStorage.getItem("password")

      if (uuid && password)
        await client.tryRequest({
          method: "brume_setCurrentUser",
          params: [uuid, password]
        }).then(r => r.throw(t))

      let pong: NodeJS.Timeout | undefined = undefined

      const ping = setInterval(() => {
        channel.port1.postMessage({ id: "ping", method: "brume_ping" })
        pong = setTimeout(() => void pool.delete(index), 1000)
      }, 1000)

      const onPong = () => {
        clearTimeout(pong)
      }

      const onRequest = (request: RpcRequestInit<unknown>) => {
        background.router.onRequest(request)
      }

      const onResponse = (response: RpcResponseInit<unknown>) => {
        background.router.onResponse(response)
      }

      const onMessage = (message: MessageEvent<RpcRequestInit<unknown> | RpcResponseInit<unknown>>) => {
        if ("method" in message.data)
          return onRequest(message.data)
        if (message.data.id === "ping")
          return onPong()
        return onResponse(message.data)
      }

      channel.port1.addEventListener("message", onMessage)

      const onClean = () => {
        clearInterval(ping)
        clearTimeout(pong)
        channel.port1.removeEventListener("message", onMessage)
        channel.port1.close()
        channel.port2.close()
      }

      const port = new WebsitePort(channel.port1)
      return new Ok(new Cleaner(port, onClean))
    })
  }, { capacity: 1 })
}

export class WebsiteBackground {
  readonly ports = createWebsitePortPool(this)
  readonly router = new BackgroundRouter(this.ports)

  isWebsite(): this is WebsiteBackground {
    return true
  }

  isExtension(): false {
    return false
  }

}

export class ExtensionBackground {
  readonly channels = createExtensionChannelPool(this)
  readonly router = new BackgroundRouter(this.channels)

  isWebsite(): false {
    return false
  }

  isExtension(): this is ExtensionBackground {
    return true
  }

}

export function createExtensionChannelPool(background: ExtensionBackground) {
  return new Pool<Port, Error>(async (params) => {
    return await Result.unthrow(async t => {
      const { index, pool } = params

      const port = await tryLoop(async () => {
        return await tryBrowser(async () => {
          const port = browser.runtime.connect({ name: "foreground" })
          port.onDisconnect.addListener(() => void chrome.runtime.lastError)
          return port
        }).then(r => r.mapErrSync(Retry.new))
      }).then(r => r.throw(t))

      const onDisconnect = () => {
        pool.delete(index)
        return Ok.void()
      }

      const onRequest = (request: RpcRequestInit<unknown>) => {
        background.router.onRequest(request)
      }

      const onResponse = (response: RpcResponseInit<unknown>) => {
        background.router.onResponse(response)
      }

      const onMessage = (message: RpcRequestInit<unknown> | RpcResponseInit<unknown>) => {
        if ("method" in message)
          return onRequest(message)
        return onResponse(message)
      }

      port.onMessage.addListener(onMessage)
      port.onDisconnect.addListener(onDisconnect)

      const onClean = () => {
        port.onDisconnect.removeListener(onDisconnect)
        port.onMessage.removeListener(onMessage)
        port.disconnect()
      }

      const channel = new ExtensionPort(port)
      return new Ok(new Cleaner(channel, onClean))
    })
  }, { capacity: 1 })
}

export type Handler =
  (request: RpcRequestPreinit<unknown>) => Promise<Optional<Result<unknown, Error>>>

export class BackgroundRouter {
  readonly client = new RpcClient()

  readonly handlers = new Array<Handler>()

  readonly events = new SuperEventTarget<{
    "response": RpcResponseInit<unknown>
    "errored": Error
  }>()

  constructor(
    readonly ports: Pool<Port, Error>
  ) {
    ports.events.on("created", async e => {
      if (e.result.isOk())
        return Ok.void()
      return await this.events
        .tryEmit("errored", e.result.inner)
        .then(r => r.clear())
    })
  }

  isWebsite(): false {
    return false
  }

  isExtension(): this is ExtensionBackground {
    return true
  }

  async brume_auth_create(request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [name, displayName, dataBase64] = (request as RpcParamfulRequestPreinit<[string, string, string]>).params

      const credential = await Result.catchAndWrap<any>(async () => {
        return await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array([117, 61, 252, 231, 191, 241]),
            rp: {
              id: location.hostname,
              name: "Brume Wallet"
            },
            user: {
              id: Bytes.fromBase64(dataBase64),
              name: name,
              displayName: displayName
            },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 },
              { type: "public-key", alg: -8 },
              { type: "public-key", alg: -257 }
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform"
            }
          }
        })
      }).then(r => r.throw(t))

      const id = new Uint8Array(credential.rawId)
      return new Ok(Bytes.toBase64(id))
    })
  }

  async brume_auth_get(request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [idBase64] = (request as RpcParamfulRequestPreinit<[string]>).params

      const credential = await Result.catchAndWrap<any>(async () => {
        return await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array([117, 61, 252, 231, 191, 241]),
            allowCredentials: [{
              type: "public-key",
              id: Bytes.fromBase64(idBase64)
            }],
          }
        })
      }).then(r => r.throw(t))

      const data = credential.response.userHandle
      return new Ok(Bytes.toBase64(data))
    })
  }

  async tryRoute(request: RpcRequestInit<unknown>): Promise<Result<unknown, Error>> {
    if (request.method === "brume_auth_create")
      return await this.brume_auth_create(request)
    if (request.method === "brume_auth_get")
      return await this.brume_auth_get(request)

    for (const handler of this.handlers) {
      const result = await handler(request)

      if (result == null)
        continue

      return result
    }

    return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    const result = await this.tryRoute(request)
    const response = RpcResponse.rewrap(request.id, result)

    await this.trySend(response).then(r => r.ignore())
  }

  async onResponse(response: RpcResponseInit<unknown>) {
    await this.events
      .tryEmit("response", response)
      .then(r => r.ignore())
  }

  async trySend(message: unknown) {
    return await tryLoop(async () => {
      return await Result.unthrow<Result<void, Looped<Error>>>(async t => {
        const channel = await this.ports.tryGet(0).then(r => r.mapErrSync(Cancel.new).throw(t))
        channel.trySend(message).mapErrSync(Skip.new).throw(t)
        return Ok.void()
      })
    })
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const request = this.client.create(init)

      await this.trySend(request).then(r => r.throw(t))

      const future = new Future<Result<RpcResponse<T>, Error>>()

      const onResponse = (message: RpcResponseInit<any>) => {
        if (message.id !== request.id)
          return Ok.void()

        const response = RpcResponse.from<T>(message)
        future.resolve(new Ok(response))
        return Ok.void()
      }

      const onErrored = (error: Error) => {
        future.resolve(new Err(error))
        return Ok.void()
      }

      try {
        this.events.on("response", onResponse)
        this.events.on("errored", onErrored)

        return await future.promise
      } finally {
        this.events.off("response", onResponse)
        this.events.off("errored", onErrored)
      }
    })
  }
}