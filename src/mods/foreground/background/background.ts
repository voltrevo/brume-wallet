import { RpcClient, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Future } from "@hazae41/future"

export type Background =
  | WebsiteBackground
  | ExtensionBackground

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

  async request<T>(init: RpcRequestPreinit) {
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

  async request<T>(init: RpcRequestPreinit) {
    const request = this.#client.create(init)

    const future = new Future<RpcResponse<T>>()

    const onMessage = (event: MessageEvent<RpcResponseInit<T>>) => {
      const response = RpcResponse.from(event.data)

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