export interface ServiceWorkerParams {
  onActive?(active: ServiceWorker): void
  onUpdating?(updating: ServiceWorker): void
}

export async function registerServiceWorker(params: ServiceWorkerParams) {
  const registration = await navigator.serviceWorker.register("/service_worker.js")

  console.log(registration.active?.state)

  /**
   * Safari may kill the service worker and not restart it
   * Put the registration in a global variable so we can grab it later
   */
  const gt = globalThis as any
  gt.registration = registration

  if (registration.waiting != null)
    params.onUpdating?.(registration.waiting)

  navigator.serviceWorker.ready.then(() =>
    params.onActive?.(registration.active!))

  registration.addEventListener("updatefound", () => {
    const { installing } = registration

    if (installing == null)
      return

    installing.addEventListener("statechange", () => {
      if (installing.state !== "installed")
        return
      if (navigator.serviceWorker.controller == null)
        return
      params.onUpdating?.(installing)
    })
  })

  let reloading = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading)
      return
    location.reload()
    reloading = true
  })
}