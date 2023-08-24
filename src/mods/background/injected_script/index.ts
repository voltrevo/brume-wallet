import { RpcClient, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Future } from "@hazae41/future"

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

  readonly client = new RpcClient()

  readonly listeners = new Map<string, Map<Sublistener, Suplistener>>()

  constructor() { }

  get isBrume() {
    return true
  }

  isConnected() {
    return true
  }

  async tryRequest(init: RpcRequestPreinit<unknown>) {
    const request = this.client.prepare(init)

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
    let listeners = this.listeners.get(key)

    if (listeners == null) {
      listeners = new Map()
      this.listeners.set(key, listeners)
    }

    let suplistener = listeners.get(sublistener)

    if (suplistener == null) {
      suplistener = (e: CustomEvent<string>) => void sublistener(JSON.parse(e.detail))
      listeners.set(sublistener, suplistener)
    }

    window.addEventListener(`ethereum#${key}`, suplistener, { passive: true })
  }

  off(key: string, sublistener: Sublistener) {
    const listeners = this.listeners.get(key)

    if (listeners == null)
      return

    const suplistener = listeners.get(sublistener)

    if (suplistener == null)
      return

    window.removeEventListener(`ethereum#${key}`, suplistener)

    listeners.delete(sublistener)

    if (listeners.size !== 0)
      return

    this.listeners.delete(key)
  }

}

const provider = new Provider()
window.ethereum = provider