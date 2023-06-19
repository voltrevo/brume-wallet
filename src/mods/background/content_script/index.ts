import { Ports, browser, tryBrowserSync } from "@/libs/browser/browser"
import { Mouse } from "@/libs/mouse/mouse"
import { RpcRequestInit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Cleaner } from "@hazae41/cleaner"
import { Pool, Retry, tryLoop } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

declare const self: ServiceWorkerGlobalScope

declare const IS_FIREFOX: boolean
declare const IS_SAFARI: boolean
declare const IS_CHROME: boolean

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "ethereum#request": CustomEvent<string>
  }
}

const mouse: Mouse = {
  x: window.screen.width / 2,
  y: window.screen.height / 2
}

addEventListener("mousemove", (e: MouseEvent) => {
  mouse.x = e.screenX
  mouse.y = e.screenY
}, { passive: true })

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

const ports = new Pool<chrome.runtime.Port, Error>(async (params) => {
  return Result.unthrow(async t => {
    const { index, pool } = params

    const port = await tryLoop(async () => {
      return tryBrowserSync(() => {
        const port = browser.runtime.connect({ name: location.origin })
        port.onDisconnect.addListener(() => void chrome.runtime.lastError)
        return port
      }).mapErrSync(Retry.new)
    }, { base: 1, max: Number.MAX_SAFE_INTEGER }).then(r => r.throw(t))

    const onMessage = (response: RpcResponseInit) => {
      const detail = JSON.stringify(response)
      const event = new CustomEvent("ethereum#response", { detail })
      window.dispatchEvent(event)
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

window.addEventListener("ethereum#request", async (event: CustomEvent<string>) => {
  const request = JSON.parse(event.detail) as RpcRequestInit<unknown>
  const result = await Ports.tryGetAndPostMessage(ports, { request, mouse })

  if (result.isOk())
    return

  const response = RpcResponse.rewrap(request.id, result)
  const detail = JSON.stringify(response)
  const event2 = new CustomEvent("ethereum#response", { detail })
  window.dispatchEvent(event2)
})