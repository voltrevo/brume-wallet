import { browser, tryBrowser } from "@/libs/browser/browser"
import { ExtensionPort } from "@/libs/channel/channel"
import { Mouse } from "@/libs/mouse/mouse"
import { RpcParamfulRequestPreinit, RpcRequestInit, RpcRequestPreinit, RpcResponse } from "@/libs/rpc"
import { Cleaner } from "@hazae41/cleaner"
import { None, Some } from "@hazae41/option"
import { Pool } from "@hazae41/piscine"
import { Err, Ok, Result } from "@hazae41/result"

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

new Pool<chrome.runtime.Port, Error>(async (params) => {
  return Result.unthrow(async t => {
    const { index, pool } = params

    await new Promise(ok => setTimeout(ok, 1))

    const raw = await tryBrowser(async () => {
      const port = browser.runtime.connect({ name: location.origin })
      port.onDisconnect.addListener(() => void chrome.runtime.lastError)
      return port
    }).then(r => r.throw(t))

    const port = new ExtensionPort("background", raw)

    const onScriptRequest = async (input: CustomEvent<string>) => {
      const request = JSON.parse(input.detail) as RpcRequestInit<unknown>

      const response = await port
        .tryRequest({ method: "brume_mouse", params: [request, mouse] })
        .then(r => r.unwrapOrElseSync(e => RpcResponse.rewrap(request.id, new Err(e))))

      const detail = JSON.stringify(response)
      const output = new CustomEvent("ethereum#response", { detail })
      window.dispatchEvent(output)
    }

    window.addEventListener("ethereum#request", onScriptRequest, { passive: true })

    const onAccountsChanged = async (request: RpcRequestPreinit<unknown>) => {
      const [accounts] = (request as RpcParamfulRequestPreinit<[string[]]>).params

      const detail = JSON.stringify(accounts)
      const output = new CustomEvent("ethereum#accountsChanged", { detail })
      window.dispatchEvent(output)
      return Ok.void()
    }

    const onChainChanged = async (request: RpcRequestPreinit<unknown>) => {
      const [chainId] = (request as RpcParamfulRequestPreinit<[string]>).params

      const detail = JSON.stringify(chainId)
      const output = new CustomEvent("ethereum#chainChanged", { detail })
      window.dispatchEvent(output)
      return Ok.void()
    }

    const onBackgroundRequest = async (request: RpcRequestPreinit<unknown>) => {
      if (request.method === "accountsChanged")
        return new Some(await onAccountsChanged(request))
      if (request.method === "chainChanged")
        return new Some(await onChainChanged(request))
      return new None()
    }

    port.events.on("request", onBackgroundRequest, { passive: true })

    const onClose = () => {
      pool.delete(index)
      return new None()
    }

    port.events.on("close", onClose, { passive: true })

    const onClean = () => {
      window.removeEventListener("ethereum#request", onScriptRequest)
      port.events.off("close", onClose)
      port.clean()
      raw.disconnect()
    }

    return new Ok(new Cleaner(raw, onClean))
  })
}, { capacity: 1 })