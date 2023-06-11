import { browser } from "@/libs/browser/browser"
import { RpcRequestInit, RpcResponseInit } from "@/libs/rpc"

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

const ethereum = browser.runtime.connect({ name: "ethereum" })

ethereum.onMessage.addListener((msg: RpcResponseInit) => {
  window.dispatchEvent(new CustomEvent("ethereum#response", { detail: msg }))
})

window.addEventListener("ethereum#request", (e: CustomEvent<RpcRequestInit>) => {
  ethereum.postMessage(e.detail)
})