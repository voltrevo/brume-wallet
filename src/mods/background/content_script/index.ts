import { PrecacheEntry, precacheAndRoute } from "workbox-precaching"

declare interface ServiceWorkerGlobalScope {
  __WB?: true,
  __WB_MANIFEST: PrecacheEntry[]
}

declare var self: ServiceWorkerGlobalScope

if (self.__WB) {
  precacheAndRoute(self.__WB_MANIFEST)
}
