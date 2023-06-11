import { browser } from "@/libs/browser/browser"
import { Rpc } from "@/libs/rpc"

declare const self: ServiceWorkerGlobalScope

declare const IS_FIREFOX: boolean
declare const IS_SAFARI: boolean
declare const IS_CHROME: boolean

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "ethereum#request": CustomEvent<Rpc.Request>
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

function onRequest(e: CustomEvent<Rpc.Request>) {
  browser.runtime.sendMessage({})
}

window.addEventListener("ethereum#request", onRequest)