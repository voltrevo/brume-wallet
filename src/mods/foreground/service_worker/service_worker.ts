export interface ServiceWorkerParams {
  onUpdateInstalled(): void
}

export async function registerServiceWorker(params?: ServiceWorkerParams) {
  const registration = await navigator.serviceWorker.register("/service_worker.js")

  registration.addEventListener("updatefound", () => {
    const { installing } = registration

    if (installing === null)
      return

    installing.addEventListener("statechange", () => {
      if (installing.state !== "installed")
        return
      // params.onUpdateInstalled()
      location.reload()
    })
  })
}