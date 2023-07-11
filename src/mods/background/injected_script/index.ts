import { Blobs } from "@/libs/blob/blob"
import { tryFetchAsBlob, tryFetchAsJson } from "@/libs/fetch/fetch"
import { RpcClient, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Future } from "@hazae41/future"
import { OriginData } from "../service_worker/entities/origins/data"

declare global {
  interface Window {
    ethereum?: Provider
  }
}

type EthereumEventKey = `ethereum#${string}`

type Sublistener = (...params: any[]) => void
type Suplistener = (e: CustomEvent<string>) => void

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    [k: EthereumEventKey]: CustomEvent<string>
  }
}

class Provider {

  readonly #client = new RpcClient()

  readonly #listeners = new Map<string, Map<Sublistener, Suplistener>>()

  constructor() { }

  get isBrume() {
    return true
  }

  isConnected() {
    return true
  }

  async tryRequest(init: RpcRequestPreinit<unknown>) {
    const request = this.#client.create(init)

    const future = new Future<RpcResponse<unknown>>()

    const onResponse = (e: CustomEvent<string>) => {
      const init = JSON.parse(e.detail) as RpcResponseInit<unknown>

      if (init.id !== request.id)
        return

      const response = RpcResponse.from(init)
      future.resolve(response)
    }

    try {
      window.addEventListener("ethereum#response", onResponse)

      const detail = JSON.stringify(request)
      const event = new CustomEvent("ethereum#request", { detail })
      window.dispatchEvent(event)

      return await future.promise
    } finally {
      window.removeEventListener("ethereum#response", onResponse)
    }
  }

  async request(init: RpcRequestPreinit<unknown>) {
    return await this.tryRequest(init).then(r => r.unwrap())
  }

  on(key: string, sublistener: Sublistener) {
    let listeners = this.#listeners.get(key)

    if (listeners == null) {
      listeners = new Map()
      this.#listeners.set(key, listeners)
    }

    let suplistener = listeners.get(sublistener)

    if (suplistener == null) {
      suplistener = (e: CustomEvent<string>) => void sublistener(JSON.parse(e.detail))
      listeners.set(sublistener, suplistener)
    }

    window.addEventListener(`ethereum#${key}`, suplistener, { passive: true })
  }

  off(key: string, sublistener: Sublistener) {
    const listeners = this.#listeners.get(key)

    if (listeners == null)
      return

    const suplistener = listeners.get(sublistener)

    if (suplistener == null)
      return

    window.removeEventListener(`ethereum#${key}`, suplistener)

    listeners.delete(sublistener)

    if (listeners.size !== 0)
      return

    this.#listeners.delete(key)
  }

}

const provider = new Provider()
window.ethereum = provider

const onFirstConnect = async () => {
  provider.off("connect", onFirstConnect)

  const origin: Partial<OriginData> = {
    title: document.title
  }

  for (const meta of document.getElementsByTagName("meta")) {
    if (meta.name === "application-name") {
      origin.title = meta.content
      continue
    }
  }

  for (const link of document.getElementsByTagName("link")) {
    if (["icon", "shortcut icon", "icon shortcut"].includes(link.rel)) {
      const blob = await tryFetchAsBlob(link.href)

      if (blob.isErr())
        continue

      const data = await Blobs.toData(blob.inner)

      if (data.isErr())
        continue

      origin.icon = data.inner
      continue
    }

    if (link.rel === "manifest") {
      const manifest = await tryFetchAsJson<any>(link.href)

      if (manifest.isErr())
        continue

      if (manifest.inner.name)
        origin.title = manifest.inner.name
      if (manifest.inner.short_name)
        origin.title = manifest.inner.short_name
      if (manifest.inner.description)
        origin.description = manifest.inner.description
      continue
    }
  }

  if (!origin.icon) {
    await (async () => {
      const blob = await tryFetchAsBlob("/favicon.ico")

      if (blob.isErr())
        return

      const data = await Blobs.toData(blob.inner)

      if (data.isErr())
        return

      origin.icon = data.inner
    })()
  }

  provider.tryRequest({
    method: "brume_origin",
    params: [origin]
  }).then(r => r.ignore())
}

provider.on("connect", onFirstConnect)