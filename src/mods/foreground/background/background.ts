import { browser } from "@/libs/browser/browser"
import { RpcClient, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Cleaner } from "@hazae41/cleaner"
import { Future } from "@hazae41/future"
import { Pool } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

export type Backgrounds =
  | Pool<WebsiteBackground, Error>
  | Pool<ExtensionBackground, Error>

export function createWebsiteBackgroundPool() {
  return new Pool<WebsiteBackground, Error>(async (params) => {
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

      const background = new WebsiteBackground(channel)
      return new Ok(new Cleaner(background, onClean))
    })
  }, { capacity: 1 })
}

export class WebsiteBackground {
  readonly #client = new RpcClient()

  constructor(
    readonly channel: MessageChannel
  ) { }

  isWebsite(): this is WebsiteBackground {
    return true
  }

  isExtension(): false {
    return false
  }

  async request<T>(init: RpcRequestPreinit<unknown>) {
    const request = this.#client.create(init)

    const future = new Future<RpcResponse<T>>()

    const onMessage = (event: MessageEvent<RpcResponseInit<T>>) => {
      const response = RpcResponse.from(event.data)

      if (response.id !== request.id)
        return
      future.resolve(response)
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

export function createExtensionBackgroundPool() {
  return new Pool<ExtensionBackground, Error>(async (params) => {
    return await Result.unthrow(async t => {
      const { index, pool } = params

      const port = browser.runtime.connect({ name: "foreground" })

      const onDisconnect = () => {
        pool.delete(index)
        return Ok.void()
      }

      port.onDisconnect.addListener(onDisconnect)

      const onClean = () => {
        port.onDisconnect.removeListener(onDisconnect)
        port.disconnect()
      }

      const background = new ExtensionBackground(port)
      return new Ok(new Cleaner(background, onClean))
    })
  }, { capacity: 1 })
}


export class ExtensionBackground {
  readonly #client = new RpcClient()

  constructor(
    readonly port: chrome.runtime.Port
  ) { }

  isWebsite(): false {
    return false
  }

  isExtension(): this is ExtensionBackground {
    return true
  }

  async request<T>(init: RpcRequestPreinit<unknown>) {
    const request = this.#client.create(init)

    const future = new Future<RpcResponse<T>>()

    const onMessage = (message: RpcResponseInit<T>) => {
      const response = RpcResponse.from(message)

      if (response.id !== request.id)
        return
      future.resolve(response)
    }

    try {
      this.port.onMessage.addListener(onMessage)
      this.port.postMessage(request)

      return await future.promise
    } finally {
      this.port.onMessage.removeListener(onMessage)
    }
  }

}