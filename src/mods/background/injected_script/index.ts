import "@hazae41/symbol-dispose-polyfill";

import { createDummy } from "@/libs/dummy";
import { Future } from "@hazae41/future";
import { RpcCounter, RpcOk, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";
import { Ok } from "@hazae41/result";

declare global {
  interface Window {
    ethereum?: EIP1193Provider
    web3?: Web3
  }
}
interface Web3 {
  readonly currentProvider: EIP1193Provider
  readonly __isMetaMaskShim__: true
}

interface EIP1193Provider {
  /**
   * No definition? :(
   */
}

interface EIP6963ProviderInfo {
  readonly uuid: string;
  readonly name: string;
  readonly icon: string;
  readonly rdns: string;
}

interface EIP6963ProviderDetail {
  readonly info: EIP6963ProviderInfo;
  readonly provider: EIP1193Provider;
}

interface EIP6963AnnounceProviderEvent extends CustomEvent {
  readonly type: "eip6963:announceProvider";
  readonly detail: EIP6963ProviderDetail;
}

interface EIP6963RequestProviderEvent extends CustomEvent {
  readonly type: "eip6963:requestProvider";
}

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    "eip6963:announceProvider": EIP6963AnnounceProviderEvent,
    "eip6963:requestProvider": EIP6963RequestProviderEvent
  }
}

type EthereumEventKey = `ethereum:${string}`
type BrumeEventKey = `brume:${string}`

type Listener = (...params: any[]) => void

declare global {
  interface DedicatedWorkerGlobalScopeEventMap {
    [k: BrumeEventKey]: CustomEvent<string>
    [k: EthereumEventKey]: CustomEvent<string>
  }
}

class Provider {

  readonly _counter = new RpcCounter()

  readonly _listenersByEvent = new Map<string, Set<Listener>>()

  /**
   * @deprecated
   */
  autoRefreshOnNetworkChange = false

  /**
   * @deprecated
   */
  _accounts = new Array<string>()

  /**
   * @deprecated
   */
  _chainId?: string

  /**
   * @deprecated
   */
  _networkVersion?: string

  /**
   * @deprecated
   */
  _listenerCount = 0

  constructor() {
    /**
     * Fix for that poorly-coded app that does `const { request } = provider`
     */
    this.request = this.request.bind(this)
    this.send = this.send.bind(this)
    this.sendAsync = this.sendAsync.bind(this)
    this.enable = this.enable.bind(this)
    this.isConnected = this.isConnected.bind(this)
    this.isUnlocked = this.isUnlocked.bind(this)
    this.on = this.on.bind(this)
    this.off = this.off.bind(this)
    this.once = this.once.bind(this)
    this.emit = this.emit.bind(this)
    this.addListener = this.addListener.bind(this)
    this.removeListener = this.removeListener.bind(this)
    this.prependListener = this.prependListener.bind(this)
    this.prependOnceListener = this.prependOnceListener.bind(this)
    this.removeAllListeners = this.removeAllListeners.bind(this)
    this.eventNames = this.eventNames.bind(this)
    this.listeners = this.listeners.bind(this)
    this.rawListeners = this.rawListeners.bind(this)
    this.listenerCount = this.listenerCount.bind(this)
    this.getMaxListeners = this.getMaxListeners.bind(this)
    this.setMaxListeners = this.setMaxListeners.bind(this)

    this._reemit("connect")
    this._reemit("disconnect")
    this._reemit("accountsChanged")
    this._reemit("chainChanged")
    this._reemit("networkChanged")

    this.on("accountsChanged", (accounts: string[]) => {
      this._accounts = accounts
    })

    this.on("chainChanged", (chainId: string) => {
      this._chainId = chainId
    })

    /**
     * Fix for that old app that needs to reload on network change
     */
    this.on("networkChanged", (networkVersion: string) => {
      this._networkVersion = networkVersion

      if (!this.autoRefreshOnNetworkChange)
        return

      location.reload()
    })

    this.request<string[]>({
      method: "eth_accounts"
    }).then(r => {
      this._accounts = r
    }).catch(() => { })

    this.request<string>({
      method: "eth_chainId"
    }).then(r => {
      this._chainId = r
    }).catch(() => { })

    this.request<string>({
      method: "net_version"
    }).then(r => {
      this._networkVersion = r
    }).catch(() => { })
  }

  get isBrume() {
    return true
  }

  get isMetaMask() {
    return true
  }

  /**
   * @deprecated
   */
  isConnected() {
    return true
  }

  /**
   * @deprecated
   */
  isUnlocked() {
    return true
  }

  /**
   * @deprecated
   */
  get chainId() {
    return this._chainId
  }

  /**
   * @deprecated
   */
  get networkVersion() {
    return this._networkVersion
  }

  /**
   * @deprecated
   */
  get selectedAddress() {
    return this._accounts[0]
  }

  /**
   * @deprecated
   */
  get _metamask() {
    return this
  }

  /**
   * @deprecated
   */
  eventNames() {
    return ["connect", "disconnect", "chainChanged", "accountsChanged", "networkChanged"] as const
  }

  /**
   * @deprecated
   */
  getMaxListeners() {
    return Number.MAX_SAFE_INTEGER
  }

  /**
   * @deprecated
   */
  setMaxListeners(x: number) {
    return this
  }

  /**
   * @deprecated
   */
  listenerCount() {
    return this._listenerCount
  }

  /**
   * @deprecated
   */
  listeners(key: string) {
    const listeners = this._listenersByEvent.get(key)

    if (listeners == null)
      return []
    return [...listeners]
  }

  /**
   * @deprecated
   */
  rawListeners(key: string) {
    return this.listeners(key)
  }

  /**
   * @deprecated
   */
  async enable() {
    /**
     * Enable compatibility mode for that old app that needs to reload on network change
     */
    this.autoRefreshOnNetworkChange = true

    return await this.request({ method: "eth_requestAccounts" })
  }

  async _request<T>(reqinit: RpcRequestPreinit<unknown>) {
    const { id = null, method, params } = reqinit

    const request = this._counter.prepare({ method, params })
    const future = new Future<RpcResponse<T>>()

    const onResponse = (e: CustomEvent<string>) => {
      const resinit = JSON.parse(e.detail) as RpcResponseInit<T>

      if (resinit.id !== request.id)
        return

      const response = RpcResponse.from(resinit)
      const rewrapped = RpcResponse.rewrap(id, response)

      future.resolve(rewrapped)
    }

    try {
      window.addEventListener("ethereum:response", onResponse)

      const detail = JSON.stringify(request)
      const event = new CustomEvent("ethereum:request", { detail })
      window.dispatchEvent(event)

      return await future.promise
    } finally {
      window.removeEventListener("ethereum:response", onResponse)
    }
  }

  async request<T>(init: RpcRequestPreinit<unknown>) {
    console.log("request", init)

    const result = await this._request<T>(init)

    console.log("result", result)

    if (result.isErr())
      throw result.getErr()

    return result.get()
  }

  async requestBatch(inits: RpcRequestPreinit<unknown>[]) {
    return await Promise.all(inits.map(init => this._request(init)))
  }

  async _send(init: RpcRequestPreinit<unknown>, callback: (err: unknown, ok: unknown) => void) {
    const response = await this._request(init)

    if (response.isErr())
      callback(response.inner.toJSON(), response.toJSON())
    else
      callback(null, response.toJSON())
  }

  /**
   * @deprecated
   */
  send(init: string | RpcRequestPreinit<unknown>, callback?: (err: unknown, ok: unknown) => void) {
    if (typeof init === "string")
      init = { method: init }

    const { id = null } = init

    console.log("send", init, this._accounts)

    if (callback != null)
      return void this._send(init, callback)
    if (init.method === "eth_accounts")
      return RpcOk.rewrap(id, new Ok(this._accounts)).toJSON()
    if (init.method === "eth_coinbase")
      return RpcOk.rewrap(id, new Ok(this.selectedAddress)).toJSON()
    if (init.method === "net_version")
      return RpcOk.rewrap(id, new Ok(this._networkVersion)).toJSON()
    if (init.method === "eth_uninstallFilter")
      throw new Error(`Unimplemented method ${init.method}`)

    throw new Error(`Asynchronous method ${init.method} requires a callback`)
  }

  /**
   * @deprecated
   */
  sendAsync(init: string | RpcRequestPreinit<unknown>, callback: (err: unknown, ok: unknown) => void) {
    if (typeof init === "string")
      init = { method: init }
    this._send(init, callback)
  }

  _reemit(key: string) {
    this._listenersByEvent.set(key, new Set())

    window.addEventListener(`ethereum:${key}`, (e: CustomEvent<string>) => {
      this.emit(key, JSON.parse(e.detail))
    }, { passive: true })
  }

  emit(key: string, ...params: any[]) {
    const listeners = this._listenersByEvent.get(key)

    if (listeners == null)
      return

    for (const listener of listeners)
      listener(...params)

    return
  }

  on(key: string, listener: Listener) {
    this.addListener(key, listener)

    return this
  }

  off(key: string, listener: Listener) {
    this.removeListener(key, listener)

    return this
  }

  once(key: string, listener: Listener) {
    const listener2 = (...params: any[]) => {
      listener(...params)
      this.off(key, listener2)
    }

    this.on(key, listener2)

    return this
  }

  addListener(key: string, listener: Listener) {
    const listeners = this._listenersByEvent.get(key)

    if (listeners == null)
      return this

    this._listenerCount -= listeners.size

    listeners.add(listener)

    this._listenerCount += listeners.size

    return this
  }

  removeListener(key: string, listener: Listener) {
    const listeners = this._listenersByEvent.get(key)

    if (listeners == null)
      return this

    if (!listeners.delete(listener))
      return this

    this._listenerCount--

    return this
  }

  removeAllListeners(key: string) {
    const listeners = this._listenersByEvent.get(key)

    if (listeners == null)
      return this

    this._listenerCount -= listeners.size

    listeners.clear()

    return this
  }

  prependListener(key: string, listener: Listener) {
    const listeners = this._listenersByEvent.get(key)

    if (listeners == null)
      return this

    this._listenerCount -= listeners.size

    const original = [...listeners]

    listeners.clear()
    listeners.add(listener)

    for (const listener of original)
      listeners.add(listener)

    this._listenerCount += listeners.size

    return this
  }

  prependOnceListener(key: string, listener: Listener) {
    const listener2 = (...params: any[]) => {
      listener(...params)
      this.off(key, listener2)
    }

    this.prependListener(key, listener2)

    return this
  }

}

/**
 * Fix for that extension that does `Object.assign(window.ethereum, { ... })`
 */
const provider = createDummy("provider", new Provider())

/**
 * Legacy web3
 */
window.web3 = createDummy("web3", { currentProvider: provider, __isMetaMaskShim__: true as const })

/**
 * EIP-1193 (legacy)
 */
window.ethereum = provider

console.log("done")

/**
 * EIP-6963 (modern)
 */
const icon = new Future<string>()

const onLogo = (event: CustomEvent<string>) => {
  icon.resolve(JSON.parse(event.detail))
}

window.addEventListener("brume:icon", onLogo, { passive: true, once: true })

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

announce()
