import "@hazae41/symbol-dispose-polyfill";

import { Blobs } from "@/libs/blobs/blobs";
import { BrowserError, browser } from "@/libs/browser/browser";
import { ExtensionRpcRouter } from "@/libs/channel/channel";
import { fetchAsBlobOrThrow, fetchAsJsonOrThrow } from "@/libs/fetch";
import { Mouse } from "@/libs/mouse/mouse";
import { isFirefoxExtension, isSafariExtension } from "@/libs/platform/platform";
import { NonReadonly } from "@/libs/types/readonly";
import { qurl } from "@/libs/url/url";
import { RpcRequestInit, RpcRequestPreinit, RpcResponse } from "@hazae41/jsonrpc";
import { None, Some } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { PreOriginData } from "../../universal/entities/origins/data";

declare const self: ServiceWorkerGlobalScope

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "ethereum:request": CustomEvent<string>
  }
}

async function main() {
  if (location.origin === new URL(browser.runtime.getURL("/")).origin)
    return

  const mouse: Mouse = {
    x: window.screen.width / 2,
    y: window.screen.height / 2
  }

  addEventListener("mousemove", (e: MouseEvent) => {
    mouse.x = e.screenX
    mouse.y = e.screenY
  }, { passive: true })

  if (isFirefoxExtension() || isSafariExtension()) {
    const container = document.documentElement

    const scriptBody = atob("INJECTED_SCRIPT")
    const scriptUrl = browser.runtime.getURL("injected_script.js")

    const element = document.createElement("script")
    element.type = "text/javascript"
    element.textContent = `${scriptBody}\n//# sourceURL=${scriptUrl}`

    container.insertBefore(element, container.children[0])
    container.removeChild(element)
  }

  async function getOrigin() {
    const origin: NonReadonly<PreOriginData> = {
      origin: location.origin,
      title: document.title
    }

    for (const meta of document.getElementsByTagName("meta")) {
      if (meta.name === "application-name") {
        origin.title = meta.content
        continue
      }
    }

    for (const link of document.getElementsByTagName("link")) {
      if (["icon", "shortcut icon", "icon shortcut"].includes(link.rel)) {
        const blob = await Result.runAndWrap(() => fetchAsBlobOrThrow(link.href))

        if (blob.isErr())
          continue

        const data = await Result.runAndWrap(() => Blobs.readAsDataUrlOrThrow(blob.inner))

        if (data.isErr())
          continue

        origin.icon = data.inner
        continue
      }

      if (link.rel === "manifest") {
        const manifest = await Result.runAndWrap(() => fetchAsJsonOrThrow<any>(link.href))

        if (manifest.isErr())
          continue

        if (manifest.inner.name)
          origin.title = manifest.inner.name
        if (manifest.inner.short_name)
          origin.title = manifest.inner.short_name
        if (manifest.inner.description)
          origin.description = manifest.inner.description
        continue
      }
    }

    if (!origin.icon) {
      await (async () => {
        const blob = await Result.runAndWrap(() => fetchAsBlobOrThrow("/favicon.ico"))

        if (blob.isErr())
          return

        const data = await Result.runAndWrap(() => Blobs.readAsDataUrlOrThrow(blob.inner))

        if (data.isErr())
          return

        origin.icon = data.inner
      })()
    }

    return origin
  }

  try {
    const port = BrowserError.runOrThrowSync(() => {
      const port = browser.runtime.connect({ name: "content_script->background" })
      port.onDisconnect.addListener(() => void chrome.runtime.lastError)
      return port
    })

    const router = new ExtensionRpcRouter("background", port)

    const onScriptRequest = async (input: CustomEvent<string>) => {
      const request = JSON.parse(input.detail) as RpcRequestInit<unknown>

      const result = await router.tryRequest({ method: "brume_run", params: [request, mouse] })
      const response = RpcResponse.rewrap(request.id, result.flatten())

      const detail = JSON.stringify(response)
      const output = new CustomEvent("ethereum:response", { detail })
      window.dispatchEvent(output)
    }

    const onAccountsChanged = async (request: RpcRequestPreinit<unknown>) => {
      const [accounts] = (request as RpcRequestPreinit<[string[]]>).params

      const detail = JSON.stringify(accounts)
      const event = new CustomEvent("ethereum:accountsChanged", { detail })
      window.dispatchEvent(event)

      return Ok.void()
    }

    const onConnect = async (request: RpcRequestPreinit<unknown>) => {
      const [{ chainId }] = (request as RpcRequestPreinit<[{ chainId: string }]>).params

      const detail = JSON.stringify({ chainId })
      const event = new CustomEvent("ethereum:connect", { detail })
      window.dispatchEvent(event)

      return Ok.void()
    }

    const onChainChanged = async (request: RpcRequestPreinit<unknown>) => {
      const [chainId] = (request as RpcRequestPreinit<[string]>).params

      const detail = JSON.stringify(chainId)
      const event = new CustomEvent("ethereum:chainChanged", { detail })
      window.dispatchEvent(event)

      return Ok.void()
    }

    const onNetworkChanged = async (request: RpcRequestPreinit<unknown>) => {
      const [chainId] = (request as RpcRequestPreinit<[string]>).params

      const detail = JSON.stringify(chainId)
      const event = new CustomEvent("ethereum:networkChanged", { detail })
      window.dispatchEvent(event)

      return Ok.void()
    }

    const onBackgroundRequest = async (request: RpcRequestPreinit<unknown>) => {
      if (request.method === "brume_origin")
        return new Some(new Ok(await getOrigin()))
      if (request.method === "connect")
        return new Some(await onConnect(request))
      if (request.method === "accountsChanged")
        return new Some(await onAccountsChanged(request))
      if (request.method === "chainChanged")
        return new Some(await onChainChanged(request))
      if (request.method === "networkChanged")
        return new Some(await onNetworkChanged(request))
      return new None()
    }

    const onClose = async () => {
      const event = new CustomEvent("ethereum:disconnect", {})
      window.dispatchEvent(event)

      return new None()
    }

    window.addEventListener("ethereum:request", onScriptRequest, { passive: true })
    router.events.on("request", onBackgroundRequest, { passive: true })
    router.events.on("close", onClose, { passive: true })

    const icon = await router.requestOrThrow<string>({
      method: "brume_icon"
    }, AbortSignal.timeout(1000)).then(r => r.unwrap())

    const detail = JSON.stringify(icon)
    const event = new CustomEvent("brume:icon", { detail })
    window.dispatchEvent(event)
  } catch (e: unknown) {
    if (!isSafariExtension())
      throw e

    if (sessionStorage.getItem("brume:opened"))
      throw e

    sessionStorage.setItem("brume:opened", "true")

    const opener = BrowserError.runOrThrowSync(() => browser.runtime.getURL("/opener.html"))
    const opened = qurl(opener, { url: location.href })

    location.replace(opened)

    throw e
  }
}

await main()