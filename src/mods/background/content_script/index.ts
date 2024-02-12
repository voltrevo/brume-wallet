import "@hazae41/symbol-dispose-polyfill"

import { Blobs } from "@/libs/blobs/blobs"
import { BrowserError, browser } from "@/libs/browser/browser"
import { ExtensionRpcRouter } from "@/libs/channel/channel"
import { tryFetchAsBlob, tryFetchAsJson } from "@/libs/fetch/fetch"
import { Mouse } from "@/libs/mouse/mouse"
import { isFirefoxExt, isSafariExt } from "@/libs/platform/platform"
import { AbortSignals } from "@/libs/signals/signals"
import { NonReadonly } from "@/libs/types/readonly"
import { qurl } from "@/libs/url/url"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { RpcRequestInit, RpcRequestPreinit, RpcResponse } from "@hazae41/jsonrpc"
import { None, Some } from "@hazae41/option"
import { Pool } from "@hazae41/piscine"
import { Ok } from "@hazae41/result"
import { PreOriginData } from "../service_worker/entities/origins/data"

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

  if (isFirefoxExt() || isSafariExt()) {
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
        const blob = await tryFetchAsBlob(link.href)

        if (blob.isErr())
          continue

        const data = await Blobs.tryReadAsDataUrl(blob.inner)

        if (data.isErr())
          continue

        origin.icon = data.inner
        continue
      }

      if (link.rel === "manifest") {
        const manifest = await tryFetchAsJson<any>(link.href)

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
        const blob = await tryFetchAsBlob("/favicon.ico")

        if (blob.isErr())
          return

        const data = await Blobs.tryReadAsDataUrl(blob.inner)

        if (data.isErr())
          return

        origin.icon = data.inner
      })()
    }

    return origin
  }

  new Pool<Disposer<ExtensionRpcRouter>>(async (params) => {
    let connected = false

    try {
      const { index, pool } = params

      await new Promise(ok => setTimeout(ok, 1))

      const raw = BrowserError.runOrThrowSync(() => {
        const port = browser.runtime.connect({ name: location.origin })
        port.onDisconnect.addListener(() => void chrome.runtime.lastError)
        return port
      })

      using preChannel = new Box(new Disposer(raw, () => raw.disconnect()))
      using preRouter = new Box(new ExtensionRpcRouter("background", preChannel.inner.inner))

      await preRouter.getOrThrow().waitHelloOrThrow(AbortSignals.timeout(1000))

      console.log("Got hello on page")

      connected = true

      const port = preChannel.moveOrThrow()
      const router = preRouter.moveOrThrow()

      const onWrapperClean = () => {
        using _0 = port
        using _1 = router
      }

      using preWrapper = new Box(new Disposer(router.inner, onWrapperClean))

      const onScriptRequest = async (input: CustomEvent<string>) => {
        const request = JSON.parse(input.detail) as RpcRequestInit<unknown>

        const result = await router.inner.tryRequest({ method: "brume_run", params: [request, mouse] })
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

        pool.restart(index)
        return new None()
      }

      window.addEventListener("ethereum:request", onScriptRequest, { passive: true })
      router.inner.events.on("request", onBackgroundRequest, { passive: true })
      router.inner.events.on("close", onClose, { passive: true })

      const wrapper = preWrapper.moveOrThrow()

      const onEntryClean = () => {
        using postinner = wrapper

        window.removeEventListener("ethereum:request", onScriptRequest)
        router.inner.events.off("request", onBackgroundRequest)
        router.inner.events.off("close", onClose)
      }

      using preEntry = new Box(new Disposer(wrapper, onEntryClean))

      const icon = await router.inner.requestOrThrow<string>({
        method: "brume_icon"
      }, AbortSignals.never()).then(r => r.unwrap())

      const detail = JSON.stringify(icon)
      const event = new CustomEvent("brume:icon", { detail })
      window.dispatchEvent(event)

      return preEntry.unwrapOrThrow()
    } catch (e: unknown) {
      if (connected)
        throw e

      const opener = BrowserError.runOrThrowSync(() => browser.runtime.getURL("/opener.html"))
      const opened = qurl(opener, { url: location.href })

      location.replace(opened)
      throw e
    }
  }, { capacity: 1 })
}

await main()