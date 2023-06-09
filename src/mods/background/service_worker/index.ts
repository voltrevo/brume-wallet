import { Berith } from "@hazae41/berith"
import { TorClientDuplex, createWebSocketSnowflakeStream } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Morax } from "@hazae41/morax"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
import { PrecacheEntry, precacheAndRoute } from "workbox-precaching"

declare interface ServiceWorkerGlobalScope {
  __WB_PRODUCTION?: boolean,
  __WB_MANIFEST: PrecacheEntry[]
}

declare var self: ServiceWorkerGlobalScope

if (self.__WB_PRODUCTION && !location.protocol.endsWith("extension:"))
  precacheAndRoute(self.__WB_MANIFEST)

async function main() {
  await Berith.initBundledOnce()
  await Morax.initBundledOnce()

  const ed25519 = Ed25519.fromBerith(Berith)
  const x25519 = X25519.fromBerith(Berith)
  const sha1 = Sha1.fromMorax(Morax)

  const fallbacksRes = await fetch("https://raw.githubusercontent.com/hazae41/echalote/master/tools/fallbacks/fallbacks.json")
  if (!fallbacksRes.ok) throw new Error(await fallbacksRes.text())
  const fallbacks = await fallbacksRes.json()

  const params = { fallbacks, ed25519, x25519, sha1 }

  const tcp = await createWebSocketSnowflakeStream("wss://snowflake.bamsoftware.com")
  const tor = new TorClientDuplex(tcp, params)
}

main()