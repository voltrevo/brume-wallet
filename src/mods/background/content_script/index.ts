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
    "ethereum#request": CustomEvent<RpcRequestInit>
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

    port.onMessage.addListener(onMessage)
    port.onDisconnect.addListener(onDisconnect)

    const onClean = () => {
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

async function tryPostMessage(message: unknown): Promise<Result<void, Error>> {
  return await Result.unthrow(async t => {
    const port = await ports.tryGet(0).then(r => r.throw(t))

    return Result.catchAndWrapSync(() => {
      port.postMessage(message)
    }).mapErrSync(() => new PostMessageError())
  })
}

window.addEventListener("ethereum#request", async (event: CustomEvent<RpcRequestInit>) => {
  const result = await tryPostMessage(event.detail)

  if (result.isOk())
    return

  const response = RpcResponse.rewrap(event.detail.id, result)
  window.dispatchEvent(new CustomEvent("ethereum#response", { detail: response }))
})