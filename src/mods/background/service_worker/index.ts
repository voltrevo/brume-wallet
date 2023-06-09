import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_PRODUCTION?: boolean,
  }
}

declare const self: ServiceWorkerGlobalScope

if (self.__WB_PRODUCTION && !location.protocol.endsWith("extension:")) {
  clientsClaim()

  precacheAndRoute(self.__WB_MANIFEST)

  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING")
      self.skipWaiting()
  })
}