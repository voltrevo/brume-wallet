import { browser } from "@/libs/browser/browser"

declare const self: ServiceWorkerGlobalScope

const IS_FIREFOX = navigator.userAgent.includes("Firefox")

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

if (IS_FIREFOX)
  inject()