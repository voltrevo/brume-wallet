import { BrowserError, browser, tryBrowser, tryBrowserSync } from "@/libs/browser/browser"
import { RpcClient, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Cleaner } from "@hazae41/cleaner"
import { Future } from "@hazae41/future"
import { Cancel, Looped, Pool, Retry, Skip, tryLoop } from "@hazae41/piscine"
import { Err, Ok, Result } from "@hazae41/result"

export type Background =
  | WebsiteBackground
  | ExtensionBackground

export function createMessageChannelPool() {
  return new Pool<MessageChannel, Error>(async (params) => {
    return await Result.unthrow(async t => {

      const registration = await Result
        .catchAndWrap(() => navigator.serviceWorker.ready)
        .then(r => r.throw(t))

      const channel = new MessageChannel()

      registration.active!.postMessage("HELLO_WORLD", [channel.port2])

      channel.port1.start()
      channel.port2.start()

      const onClean = () => {
        channel.port1.close()
        channel.port2.close()
      }

      return new Ok(new Cleaner(channel, onClean))
    })
  }, { capacity: 1 })
}

export class WebsiteBackground {
  readonly #client = new RpcClient()

  constructor(
    readonly channels: Pool<MessageChannel, Error>
  ) { }

  isWebsite(): this is WebsiteBackground {
    return true
  }

  isExtension(): false {
    return false
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const channel = await this.channels.tryGet(0).then(r => r.throw(t))

      const request = this.#client.create(init)

      const future = new Future<Result<RpcResponse<T>, Error>>()

      const onMessage = (event: MessageEvent<RpcResponseInit<T>>) => {
        const response = RpcResponse.from(event.data)

        if (response.id !== request.id)
          return
        future.resolve(new Ok(response))
      }

      const onMessageError = () => {
        future.resolve(new Err(new Error(`Message error`)))
      }

      try {
        channel.port1.addEventListener("message", onMessage, { passive: true })
        channel.port1.addEventListener("messageerror", onMessageError, { passive: true })
        channel.port1.postMessage(request)

        return await future.promise
      } finally {
        channel.port1.removeEventListener("message", onMessage)
        channel.port1.removeEventListener("messageerror", onMessageError)
      }
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
      }).then(r => r.throw(t))

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

        console.log("Sending...", port)

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