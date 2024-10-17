import "@hazae41/symbol-dispose-polyfill";

import { Blobs } from "@/libs/blobs/blobs";
import { BrowserError, browser } from "@/libs/browser/browser";
import { ExtensionRpcRouter } from "@/libs/channel/channel";
import { fetchAsBlobOrThrow, fetchAsJsonOrThrow } from "@/libs/fetch";
import { RpcRequestGuard } from "@/libs/jsonrpc";
import { Mouse } from "@/libs/mouse/mouse";
import { isFirefoxExtension, isSafariExtension } from "@/libs/platform/platform";
import { NonReadonly } from "@/libs/types/readonly";
import { urlOf } from "@/libs/url/url";
import { Box, Deferred, Stack } from "@hazae41/box";
import { Disposer } from "@hazae41/disposer";
import { Guard } from "@hazae41/gardien";
import { RpcErr, RpcError, RpcErrorInit, RpcRequestPreinit, RpcResponse } from "@hazae41/jsonrpc";
import { None, Some } from "@hazae41/option";
import { Pool } from "@hazae41/piscine";
import { Result } from "@hazae41/result";
import { PreOriginData } from "../../universal/entities/origins/data";

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "ethereum:request": CustomEvent<string>
  }
}

async function getOriginData() {
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

async function main() {
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

  const routers = new Pool<Disposer<ExtensionRpcRouter>>(async (params) => {
    const { index, signal } = params

    using stack = new Box(new Stack())

    await new Promise(ok => setTimeout(ok, 1))

    let router: ExtensionRpcRouter

    try {
      const port = BrowserError.connectOrThrow({ name: "content_script->background" })
      using dport = new Box(new Disposer(port, () => port.disconnect()))

      router = new ExtensionRpcRouter("background", port)

      await router.waitHelloOrThrow(AbortSignal.any([signal, AbortSignal.timeout(1000)]))

      dport.moveOrThrow()
    } catch (e: unknown) {
      if (!isSafariExtension())
        throw e

      if (sessionStorage.getItem("#brume.opened"))
        throw e

      sessionStorage.setItem("#brume.opened", "true")

      const opener = BrowserError.runOrThrowSync(() => browser.runtime.getURL("/opener.html"))
      const opened = urlOf(opener, { url: location.href })

      location.replace(opened)

      throw e
    }

    const onEntryClean = () => router.port.disconnect()
    const entry = new Box(new Disposer(router, onEntryClean))
    stack.getOrThrow().push(entry)

    const icon = await router.requestOrThrow<string>({
      method: "brume_icon"
    }, AbortSignal.any([signal, AbortSignal.timeout(1000)])).then(r => r.getOrThrow())

    const detail = JSON.stringify(icon)
    const event = new CustomEvent("brume:icon", { detail })
    window.dispatchEvent(event)

    const onCloseOrError = () => void routers.restart(index)

    stack.getOrThrow().push(new Deferred(router.events.on("close", onCloseOrError, { passive: true })))
    stack.getOrThrow().push(new Deferred(router.events.on("error", onCloseOrError, { passive: true })))

    const onBackgroundRequest = async (request: RpcRequestPreinit<unknown>) => {
      if (request.method === "brume_origin")
        return new Some(await getOriginData())
      if (request.method === "connect")
        return new Some(await onConnect(request))
      if (request.method === "disconnect")
        return new Some(await onDisconnect(request))
      if (request.method === "accountsChanged")
        return new Some(await onAccountsChanged(request))
      if (request.method === "chainChanged")
        return new Some(await onChainChanged(request))
      if (request.method === "networkChanged")
        return new Some(await onNetworkChanged(request))
      return new None()
    }

    const onAccountsChanged = async (request: RpcRequestPreinit<unknown>) => {
      const [accounts] = (request as RpcRequestPreinit<[string[]]>).params

      const detail = JSON.stringify(accounts)
      const event = new CustomEvent("ethereum:accountsChanged", { detail })
      window.dispatchEvent(event)
    }

    const onConnect = async (request: RpcRequestPreinit<unknown>) => {
      const [{ chainId }] = (request as RpcRequestPreinit<[{ chainId: string }]>).params

      const detail = JSON.stringify({ chainId })
      const event = new CustomEvent("ethereum:connect", { detail })
      window.dispatchEvent(event)
    }

    const onDisconnect = async (request: RpcRequestPreinit<unknown>) => {
      const [error] = (request as RpcRequestPreinit<[RpcErrorInit]>).params

      const detail = JSON.stringify(error)
      const event = new CustomEvent("ethereum:disconnect", { detail })
      window.dispatchEvent(event)
    }

    const onChainChanged = async (request: RpcRequestPreinit<unknown>) => {
      const [chainId] = (request as RpcRequestPreinit<[string]>).params

      const detail = JSON.stringify(chainId)
      const event = new CustomEvent("ethereum:chainChanged", { detail })
      window.dispatchEvent(event)
    }

    const onNetworkChanged = async (request: RpcRequestPreinit<unknown>) => {
      const [chainId] = (request as RpcRequestPreinit<[string]>).params

      const detail = JSON.stringify(chainId)
      const event = new CustomEvent("ethereum:networkChanged", { detail })
      window.dispatchEvent(event)
    }

    stack.getOrThrow().push(new Deferred(router.events.on("request", onBackgroundRequest, { passive: true })))

    const unstack = stack.unwrapOrThrow()

    return new Disposer(entry, () => unstack[Symbol.dispose]())
  })

  const onScriptRequest = async (input: CustomEvent<string>) => {
    const request = Guard.asOrNull(RpcRequestGuard, JSON.parse(input.detail) as unknown)

    if (request == null)
      return

    try {
      const router = await routers.getOrThrow(0).then(r => r.get())

      const result = await router.requestOrThrow({ method: "brume_run", params: [request, mouse] })
      const response = RpcResponse.rewrap(request.id, result)

      const detail = JSON.stringify(response)
      const output = new CustomEvent("ethereum:response", { detail })
      window.dispatchEvent(output)
    } catch (e: unknown) {
      const error = RpcError.rewrap(e)
      const response = new RpcErr(request.id, error)

      const detail = JSON.stringify(response)
      const output = new CustomEvent("ethereum:response", { detail })
      window.dispatchEvent(output)
    }
  }

  window.addEventListener("ethereum:request", onScriptRequest, { passive: true })

  routers.start(0)
}

await main()