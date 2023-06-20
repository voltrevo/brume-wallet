import { BrowserError, browser, tryBrowser, tryBrowserSync } from "@/libs/browser/browser"
import { RpcClient, RpcId, RpcRequest, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Cleaner } from "@hazae41/cleaner"
import { Future } from "@hazae41/future"
import { Optional } from "@hazae41/option"
import { Cancel, Looped, Pool, Retry, Skip, tryLoop } from "@hazae41/piscine"
import { Err, Ok, Panic, Result } from "@hazae41/result"
import { RawState, Storage } from "@hazae41/xswr"

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

export class WebsiteClient {
  readonly client = new RpcClient()

  constructor(
    readonly channel: MessageChannel
  ) { }

  async tryWait<T>(id: RpcId): Promise<Result<RpcRequest<T>, Error>> {
    const future = new Future<Result<RpcRequest<T>, Error>>()

    const onMessage = (event: MessageEvent<RpcRequestInit<T>>) => {
      const response = RpcRequest.from(event.data)

      if (response.id !== id)
        return
      future.resolve(new Ok(response))
    }

    const onMessageError = () =>
      future.resolve(new Err(new MessageError()))

    try {
      this.channel.port1.addEventListener("message", onMessage, { passive: true })
      this.channel.port1.addEventListener("messageerror", onMessageError, { passive: true })

      return await future.promise
    } finally {
      this.channel.port1.removeEventListener("message", onMessage)
      this.channel.port1.removeEventListener("messageerror", onMessageError)
    }
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const request = this.client.create(init)

      const future = new Future<Result<RpcResponse<T>, Error>>()

      const onMessage = (event: MessageEvent<RpcResponseInit<T>>) => {
        const response = RpcResponse.from(event.data)

        if (response.id !== request.id)
          return
        future.resolve(new Ok(response))
      }

      const onMessageError = () =>
        future.resolve(new Err(new MessageError()))

      try {
        this.channel.port1.addEventListener("message", onMessage, { passive: true })
        this.channel.port1.addEventListener("messageerror", onMessageError, { passive: true })
        this.channel.port1.postMessage(request)

        return await future.promise
      } finally {
        this.channel.port1.removeEventListener("message", onMessage)
        this.channel.port1.removeEventListener("messageerror", onMessageError)
      }
    })
  }
}

export function createMessageChannelPool() {
  return new Pool<WebsiteClient, Error>(async (params) => {
    return await Result.unthrow(async t => {
      const { pool, index } = params

      const registration = await Result
        .catchAndWrap(() => navigator.serviceWorker.ready)
        .then(r => r.throw(t))

      const channel = new MessageChannel()
      const client = new WebsiteClient(channel)

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

      let pong: Optional<NodeJS.Timeout> = undefined

      const ping = setInterval(() => {
        channel.port1.postMessage({ id: "ping", method: "brume_ping" })
        pong = setTimeout(() => void pool.delete(index), 1000)
      }, 1000)

      const onPong = (event: MessageEvent<RpcResponseInit<unknown>>) => {
        if (event.data.id !== "ping")
          return
        clearTimeout(pong)
      }

      channel.port1.addEventListener("message", onPong)

      const onClean = () => {
        clearInterval(ping)
        clearTimeout(pong)
        channel.port1.removeEventListener("message", onPong)
        channel.port1.close()
        channel.port2.close()
      }

      return new Ok(new Cleaner(client, onClean))
    })
  }, { capacity: 1 })
}

export class WebsiteBackground {

  constructor(
    readonly channels: Pool<WebsiteClient, Error>
  ) { }

  isWebsite(): this is WebsiteBackground {
    return true
  }

  isExtension(): false {
    return false
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const client = await this.channels.tryGet(0).then(r => r.throw(t))
      const response = await client.tryRequest<T>(init).then(r => r.throw(t))

      return new Ok(response)
    })
  }

}

export function createPortPool() {
  return new Pool<chrome.runtime.Port, Error>(async (params) => {
    return await Result.unthrow(async t => {
      const { index, pool } = params

      const port = await tryLoop(async () => {
        return await tryBrowser(async () => {
          const port = browser.runtime.connect({ name: "foreground" })
          port.onDisconnect.addListener(() => void chrome.runtime.lastError)
          return port
        }).then(r => r.mapErrSync(Retry.new))
      }, { base: 1, max: Number.MAX_SAFE_INTEGER }).then(r => r.throw(t))

      const onDisconnect = () => {
        pool.delete(index)
        return Ok.void()
      }

      port.onDisconnect.addListener(onDisconnect)

      const onClean = () => {
        port.onDisconnect.removeListener(onDisconnect)
        port.disconnect()
      }

      return new Ok(new Cleaner(port, onClean))
    })
  }, { capacity: 1 })
}

export class ExtensionBackground {
  readonly #client = new RpcClient()

  constructor(
    readonly ports: Pool<chrome.runtime.Port, Error>
  ) { }

  isWebsite(): false {
    return false
  }

  isExtension(): this is ExtensionBackground {
    return true
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return tryLoop(async () => {
      return await Result.unthrow<Result<RpcResponse<T>, Looped<Error>>>(async t => {
        const port = await this.ports.tryGet(0).then(r => r.mapErrSync(Cancel.new).throw(t))

        const request = this.#client.create(init)

        const future = new Future<Result<RpcResponse<T>, BrowserError>>()

        const onMessage = (message: RpcResponseInit<T>) => {
          const response = RpcResponse.from(message)

          if (response.id !== request.id)
            return
          future.resolve(new Ok(response))
        }

        const onDisconnect = () => {
          future.resolve(new Err(new BrowserError(`Port disconnected`)))
        }

        tryBrowserSync(() => {
          port.postMessage(request)
        }).mapErrSync(Skip.new).throw(t)

        try {
          port.onMessage.addListener(onMessage)
          port.onDisconnect.addListener(onDisconnect)

          return await future.promise.then(r => r.mapErrSync(Skip.new))
        } finally {
          port.onMessage.removeListener(onMessage)
          port.onDisconnect.removeListener(onDisconnect)
        }
      })
    })
  }

}

export class GlobalStorage implements Storage {
  readonly async: true = true

  constructor(
    readonly background: Background
  ) { }

  async get(cacheKey: string) {
    return await this.background
      .tryRequest<RawState>({ method: "brume_get_global", params: [cacheKey] })
      .then(r => r.unwrap().unwrap())
  }

}

export class UserStorage implements Storage {
  readonly async: true = true

  constructor(
    readonly background: Background
  ) { }

  async get(cacheKey: string) {
    return await this.background
      .tryRequest<RawState>({ method: "brume_get_user", params: [cacheKey] })
      .then(r => r.ok().inner?.ok().inner)
  }

}