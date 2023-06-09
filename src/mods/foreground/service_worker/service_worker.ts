export interface ServiceWorkerParams {
  onUpdating(updating: ServiceWorker): void
}

export async function registerServiceWorker(params: ServiceWorkerParams) {
  const registration = await navigator.serviceWorker.register("/service_worker.js")

  if (registration.waiting !== null)
    params.onUpdating(registration.waiting)

  registration.addEventListener("updatefound", () => {
    const { installing } = registration

    if (installing === null)
      return

    installing.addEventListener("statechange", () => {
      if (installing.state !== "installed")
        return
      if (navigator.serviceWorker.controller === null)
        return
      params.onUpdating(installing)
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