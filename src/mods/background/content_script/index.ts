import { browser } from "@/libs/browser/browser"
import { RpcRequestInit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Cleaner } from "@hazae41/cleaner"
import { Pool } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

declare const self: ServiceWorkerGlobalScope

declare const IS_FIREFOX: boolean
declare const IS_SAFARI: boolean
declare const IS_CHROME: boolean

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "ethereum#request": CustomEvent<RpcRequestInit<unknown>>
  }
}

if (IS_FIREFOX || IS_SAFARI) {
  const container = document.documentElement

  const scriptBody = atob("INJECTED_SCRIPT")
  const scriptUrl = browser.runtime.getURL("injected_script.js")

  const element = document.createElement("script")
  element.type = "text/javascript"
  element.textContent = `${scriptBody}\n//# sourceURL=${scriptUrl}`

  container.insertBefore(element, container.children[0])
  container.removeChild(element)
}

const ports = new Pool<chrome.runtime.Port, never>(async (params) => {
  return Result.unthrow(async t => {
    const { index, pool } = params

    const port = browser.runtime.connect({ name: "content_script" })

    const onMessage = (msg: RpcResponseInit) => {
      window.dispatchEvent(new CustomEvent("ethereum#response", { detail: msg }))
    }

    const onDisconnect = () => {
      pool.delete(index)
      return Ok.void()
    }

    const ping = setInterval(() => {
      Ports.tryPostMessage(port, {
        id: "ping",
        jsonrpc: "2.0",
        method: "brume_ping"
      }).ignore()
    }, 1_000)

    port.onMessage.addListener(onMessage)
    port.onDisconnect.addListener(onDisconnect)

    const onClean = () => {
      clearInterval(ping)

      port.onMessage.removeListener(onMessage)
      port.onDisconnect.removeListener(onDisconnect)

      port.disconnect()
    }

    return new Ok(new Cleaner(port, onClean))
  })
}, { capacity: 1 })

export class PostMessageError extends Error {
  readonly #class = PostMessageError
  readonly name = this.#class.name

  constructor() {
    super(`Could not send message to the background`)
  }

}

export namespace Ports {

  export function tryPostMessage(port: chrome.runtime.Port, message: unknown): Result<void, PostMessageError> {
    return Result.catchAndWrapSync(() => {
      port.postMessage(message)
    }).mapErrSync(() => new PostMessageError())
  }

  export async function tryGetAndPostMessage(ports: Pool<chrome.runtime.Port, never>, message: unknown): Promise<Result<void, Error>> {
    return await ports.tryGet(0).then(r => r.andThenSync(port => tryPostMessage(port, message)))
  }

}

window.addEventListener("ethereum#request", async (event: CustomEvent<RpcRequestInit<unknown>>) => {
  const result = await Ports.tryGetAndPostMessage(ports, event.detail)

  if (result.isOk())
    return

  const response = RpcResponse.rewrap(event.detail.id, result)
  window.dispatchEvent(new CustomEvent("ethereum#response", { detail: response }))
})