import { browser } from "@/libs/browser/browser"
import { RpcRequestInit } from "@/libs/rpc"

declare const self: ServiceWorkerGlobalScope

declare const IS_FIREFOX: boolean
declare const IS_SAFARI: boolean
declare const IS_CHROME: boolean

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "ethereum#request": CustomEvent<RpcRequestInit>
  }
}

function inject() {
  const container = document.documentElement

  const scriptBody = atob("INJECTED_SCRIPT")
  const scriptUrl = browser.runtime.getURL("injected_script.js")

  const element = document.createElement("script")
  element.type = "text/javascript"
  element.textContent = `${scriptBody}\n//# sourceURL=${scriptUrl}`

  container.insertBefore(element, container.children[0])
  container.removeChild(element)
}

if (IS_FIREFOX || IS_SAFARI)
  inject()

function onRequest(e: CustomEvent<RpcRequestInit>) {
  browser.runtime.sendMessage(e.detail)
}

window.addEventListener("ethereum#request", onRequest)