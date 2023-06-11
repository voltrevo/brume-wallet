import { browser } from "@/libs/browser/browser"
import { RpcRequestInit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Catched, Err, Ok, Result } from "@hazae41/result"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_PRODUCTION?: boolean,
  }
}

declare const self: ServiceWorkerGlobalScope

const IS_EXTENSION = location.protocol.endsWith("extension:")

const IS_CHROME_EXTENSION = location.protocol === "chrome-extension:"
const IS_FIREFOX_EXTENSION = location.protocol === "moz-extension:"
const IS_SAFARI_EXTENSION = location.protocol === "safari-web-extension:"

if (self.__WB_PRODUCTION && !IS_EXTENSION) {
  clientsClaim()

  precacheAndRoute(self.__WB_MANIFEST)

  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING")
      self.skipWaiting()
  })
}

async function tryFetch<T>(url: string): Promise<Result<T, Error>> {
  try {
    const res = await fetch(url)

    if (!res.ok)
      return new Err(new Error(await res.text()))
    return new Ok(await res.json() as T)
  } catch (e: unknown) {
    return new Err(Catched.from(e))
  }
}

const FALLBACKS_URL = "https://raw.githubusercontent.com/hazae41/echalote/master/tools/fallbacks/fallbacks.json"

async function main() {
  // await Berith.initBundledOnce()
  // await Morax.initBundledOnce()

  // const ed25519 = Ed25519.fromBerith(Berith)
  // const x25519 = X25519.fromBerith(Berith)
  // const sha1 = Sha1.fromMorax(Morax)

  // const fallbacks = await tryFetch<Fallback[]>(FALLBACKS_URL)

  // const tors = createTorPool(async () => {
  //   return await tryCreateTor2({ fallbacks, ed25519, x25519, sha1 })
  // }, { capacity: 3 })

  if (IS_EXTENSION) {
    browser.runtime.onConnect.addListener(port => {
      if (port.name !== "content_script")
        return
      port.onMessage.addListener(async (msg: RpcRequestInit) => {
        const response = RpcResponse.rewrap(msg.id, tryRoute(msg))
        const init = RpcResponseInit.from(response)
        port.postMessage(init)
      })
    })

    browser.runtime.onConnect.addListener(port => {
      if (port.name !== "foreground")
        return
      port.onMessage.addListener(async (msg) => {
        const response = RpcResponse.rewrap(msg.id, tryRoute(msg))
        const init = RpcResponseInit.from(response)
        port.postMessage(init)
      })
    })

    function tryRoute(request: RpcRequestInit): Result<unknown, Error> {
      if (request.method === "eth_requestAccounts")
        return new Ok(["0x39dfd20386F5d17eBa42763606B8c704FcDd1c1D"])
      if (request.method === "eth_accounts")
        return new Ok(["0x39dfd20386F5d17eBa42763606B8c704FcDd1c1D"])
      if (request.method === "eth_chainId")
        return new Ok("0x1")
      if (request.method === "eth_blockNumber")
        return new Ok("0x65a8db")
      return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
    }
  }
}

main()