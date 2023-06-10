import { createTorPool, tryCreateTor2 } from "@/libs/tor/tors/tors"
import { Berith } from "@hazae41/berith"
import { Fallback } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Morax } from "@hazae41/morax"
import { Catched, Err, Ok, Result } from "@hazae41/result"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
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
  await Berith.initBundledOnce()
  await Morax.initBundledOnce()

  const ed25519 = Ed25519.fromBerith(Berith)
  const x25519 = X25519.fromBerith(Berith)
  const sha1 = Sha1.fromMorax(Morax)

  const fallbacks = await tryFetch<Fallback[]>(FALLBACKS_URL)

  const tors = createTorPool(async () => {
    return await tryCreateTor2({ fallbacks, ed25519, x25519, sha1 })
  }, { capacity: 3 })
}

main()