declare interface ServiceWorkerGlobalScope {
  __WB_MANIFEST: string
}

declare var self: ServiceWorkerGlobalScope

console.log(self.__WB_MANIFEST)