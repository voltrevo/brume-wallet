import "@hazae41/symbol-dispose-polyfill";

import { Future } from "@hazae41/future";
import { RpcCounter, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";

declare global {
  interface Window {
    ethereum?: EIP1193Provider
  }
}

interface EIP1193Provider {
  /**
   * No definition? :(
   */
}

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: "eip6963:announceProvider";
  detail: EIP6963ProviderDetail;
}

interface EIP6963RequestProviderEvent extends CustomEvent {
  type: "eip6963:requestProvider";
}

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "eip6963:announceProvider": EIP6963AnnounceProviderEvent,
    "eip6963:requestProvider": EIP6963RequestProviderEvent
  }
}

type EthereumEventKey = `ethereum#${string}`
type BrumeEventKey = `brume#${string}`

type Sublistener = (...params: any[]) => void
type Suplistener = (e: CustomEvent<string>) => void

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    [k: BrumeEventKey]: CustomEvent<string>
    [k: EthereumEventKey]: CustomEvent<string>
  }
}

const icon = new Future<string>()

const onLogo = (event: CustomEvent<string>) => {
  icon.resolve(JSON.parse(event.detail))
}

window.addEventListener("brume#icon", onLogo, { passive: true, once: true })

class Provider {

  readonly #counter = new RpcCounter()

  readonly #listeners = new Map<string, Map<Sublistener, Suplistener>>()

  /**
   * @deprecated
   */
  autoRefreshOnNetworkChange = true

  constructor() {
    /**
     * Fix for that poorly-coded app that does `const { request } = provider`
     */
    this.request = this.request.bind(this)
    this.on = this.on.bind(this)
    this.off = this.off.bind(this)

    /**
     * Fix for MetaMask-like
     */
    this.on("chainChanged", () => {
      if (!this.autoRefreshOnNetworkChange)
        return
      location.reload()
    })
  }

  get isBrume() {
    return true
  }

  isConnected() {
    return true
  }

  async tryRequest(init: RpcRequestPreinit<unknown>) {
    const request = this.#counter.prepare(init)

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
      suplistener = (e: CustomEvent<string>) => {
        sublistener(JSON.parse(e.detail))
      }

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

/**
 * EIP1193
 */
window.ethereum = provider

/**
 * EIP6963
 */
{
  async function announce() {
    const info: EIP6963ProviderInfo = Object.freeze({
      uuid: "e750a98c-ff2d-4fc4-b6e2-faf4d13d1add",
      name: "Brume Wallet",
      icon: await icon.promise,
      rdns: "money.brume"
    })

    const detail: EIP6963ProviderDetail = Object.freeze({ info, provider })
    const event = new CustomEvent("eip6963:announceProvider", { detail })

    window.dispatchEvent(event)
  }

  function onAnnounceRequest(event: EIP6963RequestProviderEvent) {
    announce()
  }

  window.addEventListener("eip6963:requestProvider", onAnnounceRequest, { passive: true })

  announce();
}
