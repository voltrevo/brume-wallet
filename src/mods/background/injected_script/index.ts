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
    const result = await this._request<T>(init)

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
      return this._request({ method: init }).then(r => r.toJSON())

    if (callback != null)
      return void this._send(init, callback)

    if (init.method === "eth_accounts")
      return RpcOk.rewrap(null, new Ok(this._accounts)).toJSON()
    if (init.method === "eth_coinbase")
      return RpcOk.rewrap(null, new Ok(this.selectedAddress)).toJSON()
    if (init.method === "net_version")
      return RpcOk.rewrap(null, new Ok(this._networkVersion)).toJSON()
    if (init.method === "eth_uninstallFilter")
      throw new Error(`Unimplemented method ${init}`)

    throw new Error(`Asynchronous method ${init} requires a callback`)
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

/**
 * EIP-6963 (modern)
 */
const icon = new Future<string>()

const onLogo = (event: CustomEvent<string>) => {
  icon.resolve(JSON.parse(event.detail))
}

window.addEventListener("brume:icon", onLogo, { passive: true, once: true })

async function announceAsBrume() {
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

async function announceAsMetaMask() {
  const info: EIP6963ProviderInfo = Object.freeze({
    uuid: "2a5d3935-f457-44ab-9fdd-8158fdf19e29",
    name: "MetaMask",
    icon: "data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjMzIiB2aWV3Qm94PSIwIDAgMzUgMzMiIHdpZHRoPSIzNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iLjI1Ij48cGF0aCBkPSJtMzIuOTU4MiAxLTEzLjEzNDEgOS43MTgzIDIuNDQyNC01LjcyNzMxeiIgZmlsbD0iI2UxNzcyNiIgc3Ryb2tlPSIjZTE3NzI2Ii8+PGcgZmlsbD0iI2UyNzYyNSIgc3Ryb2tlPSIjZTI3NjI1Ij48cGF0aCBkPSJtMi42NjI5NiAxIDEzLjAxNzE0IDkuODA5LTIuMzI1NC01LjgxODAyeiIvPjxwYXRoIGQ9Im0yOC4yMjk1IDIzLjUzMzUtMy40OTQ3IDUuMzM4NiA3LjQ4MjkgMi4wNjAzIDIuMTQzNi03LjI4MjN6Ii8+PHBhdGggZD0ibTEuMjcyODEgMjMuNjUwMSAyLjEzMDU1IDcuMjgyMyA3LjQ2OTk0LTIuMDYwMy0zLjQ4MTY2LTUuMzM4NnoiLz48cGF0aCBkPSJtMTAuNDcwNiAxNC41MTQ5LTIuMDc4NiAzLjEzNTggNy40MDUuMzM2OS0uMjQ2OS03Ljk2OXoiLz48cGF0aCBkPSJtMjUuMTUwNSAxNC41MTQ5LTUuMTU3NS00LjU4NzA0LS4xNjg4IDguMDU5NzQgNy40MDQ5LS4zMzY5eiIvPjxwYXRoIGQ9Im0xMC44NzMzIDI4Ljg3MjEgNC40ODE5LTIuMTYzOS0zLjg1ODMtMy4wMDYyeiIvPjxwYXRoIGQ9Im0yMC4yNjU5IDI2LjcwODIgNC40Njg5IDIuMTYzOS0uNjEwNS01LjE3MDF6Ii8+PC9nPjxwYXRoIGQ9Im0yNC43MzQ4IDI4Ljg3MjEtNC40NjktMi4xNjM5LjM2MzggMi45MDI1LS4wMzkgMS4yMzF6IiBmaWxsPSIjZDViZmIyIiBzdHJva2U9IiNkNWJmYjIiLz48cGF0aCBkPSJtMTAuODczMiAyOC44NzIxIDQuMTU3MiAxLjk2OTYtLjAyNi0xLjIzMS4zNTA4LTIuOTAyNXoiIGZpbGw9IiNkNWJmYjIiIHN0cm9rZT0iI2Q1YmZiMiIvPjxwYXRoIGQ9Im0xNS4xMDg0IDIxLjc4NDItMy43MTU1LTEuMDg4NCAyLjYyNDMtMS4yMDUxeiIgZmlsbD0iIzIzMzQ0NyIgc3Ryb2tlPSIjMjMzNDQ3Ii8+PHBhdGggZD0ibTIwLjUxMjYgMjEuNzg0MiAxLjA5MTMtMi4yOTM1IDIuNjM3MiAxLjIwNTF6IiBmaWxsPSIjMjMzNDQ3IiBzdHJva2U9IiMyMzM0NDciLz48cGF0aCBkPSJtMTAuODczMyAyOC44NzIxLjY0OTUtNS4zMzg2LTQuMTMxMTcuMTE2N3oiIGZpbGw9IiNjYzYyMjgiIHN0cm9rZT0iI2NjNjIyOCIvPjxwYXRoIGQ9Im0yNC4wOTgyIDIzLjUzMzUuNjM2NiA1LjMzODYgMy40OTQ2LTUuMjIxOXoiIGZpbGw9IiNjYzYyMjgiIHN0cm9rZT0iI2NjNjIyOCIvPjxwYXRoIGQ9Im0yNy4yMjkxIDE3LjY1MDctNy40MDUuMzM2OS42ODg1IDMuNzk2NiAxLjA5MTMtMi4yOTM1IDIuNjM3MiAxLjIwNTF6IiBmaWxsPSIjY2M2MjI4IiBzdHJva2U9IiNjYzYyMjgiLz48cGF0aCBkPSJtMTEuMzkyOSAyMC42OTU4IDIuNjI0Mi0xLjIwNTEgMS4wOTEzIDIuMjkzNS42ODg1LTMuNzk2Ni03LjQwNDk1LS4zMzY5eiIgZmlsbD0iI2NjNjIyOCIgc3Ryb2tlPSIjY2M2MjI4Ii8+PHBhdGggZD0ibTguMzkyIDE3LjY1MDcgMy4xMDQ5IDYuMDUxMy0uMTAzOS0zLjAwNjJ6IiBmaWxsPSIjZTI3NTI1IiBzdHJva2U9IiNlMjc1MjUiLz48cGF0aCBkPSJtMjQuMjQxMiAyMC42OTU4LS4xMTY5IDMuMDA2MiAzLjEwNDktNi4wNTEzeiIgZmlsbD0iI2UyNzUyNSIgc3Ryb2tlPSIjZTI3NTI1Ii8+PHBhdGggZD0ibTE1Ljc5NyAxNy45ODc2LS42ODg2IDMuNzk2Ny44NzA0IDQuNDgzMy4xOTQ5LTUuOTA4N3oiIGZpbGw9IiNlMjc1MjUiIHN0cm9rZT0iI2UyNzUyNSIvPjxwYXRoIGQ9Im0xOS44MjQyIDE3Ljk4NzYtLjM2MzggMi4zNTg0LjE4MTkgNS45MjE2Ljg3MDQtNC40ODMzeiIgZmlsbD0iI2UyNzUyNSIgc3Ryb2tlPSIjZTI3NTI1Ii8+PHBhdGggZD0ibTIwLjUxMjcgMjEuNzg0Mi0uODcwNCA0LjQ4MzQuNjIzNi40NDA2IDMuODU4NC0zLjAwNjIuMTE2OS0zLjAwNjJ6IiBmaWxsPSIjZjU4NDFmIiBzdHJva2U9IiNmNTg0MWYiLz48cGF0aCBkPSJtMTEuMzkyOSAyMC42OTU4LjEwNCAzLjAwNjIgMy44NTgzIDMuMDA2Mi42MjM2LS40NDA2LS44NzA0LTQuNDgzNHoiIGZpbGw9IiNmNTg0MWYiIHN0cm9rZT0iI2Y1ODQxZiIvPjxwYXRoIGQ9Im0yMC41OTA2IDMwLjg0MTcuMDM5LTEuMjMxLS4zMzc4LS4yODUxaC00Ljk2MjZsLS4zMjQ4LjI4NTEuMDI2IDEuMjMxLTQuMTU3Mi0xLjk2OTYgMS40NTUxIDEuMTkyMSAyLjk0ODkgMi4wMzQ0aDUuMDUzNmwyLjk2Mi0yLjAzNDQgMS40NDItMS4xOTIxeiIgZmlsbD0iI2MwYWM5ZCIgc3Ryb2tlPSIjYzBhYzlkIi8+PHBhdGggZD0ibTIwLjI2NTkgMjYuNzA4Mi0uNjIzNi0uNDQwNmgtMy42NjM1bC0uNjIzNi40NDA2LS4zNTA4IDIuOTAyNS4zMjQ4LS4yODUxaDQuOTYyNmwuMzM3OC4yODUxeiIgZmlsbD0iIzE2MTYxNiIgc3Ryb2tlPSIjMTYxNjE2Ii8+PHBhdGggZD0ibTMzLjUxNjggMTEuMzUzMiAxLjEwNDMtNS4zNjQ0Ny0xLjY2MjktNC45ODg3My0xMi42OTIzIDkuMzk0NCA0Ljg4NDYgNC4xMjA1IDYuODk4MyAyLjAwODUgMS41Mi0xLjc3NTItLjY2MjYtLjQ3OTUgMS4wNTIzLS45NTg4LS44MDU0LS42MjIgMS4wNTIzLS44MDM0eiIgZmlsbD0iIzc2M2UxYSIgc3Ryb2tlPSIjNzYzZTFhIi8+PHBhdGggZD0ibTEgNS45ODg3MyAxLjExNzI0IDUuMzY0NDctLjcxNDUxLjUzMTMgMS4wNjUyNy44MDM0LS44MDU0NS42MjIgMS4wNTIyOC45NTg4LS42NjI1NS40Nzk1IDEuNTE5OTcgMS43NzUyIDYuODk4MzUtMi4wMDg1IDQuODg0Ni00LjEyMDUtMTIuNjkyMzMtOS4zOTQ0eiIgZmlsbD0iIzc2M2UxYSIgc3Ryb2tlPSIjNzYzZTFhIi8+PHBhdGggZD0ibTMyLjA0ODkgMTYuNTIzNC02Ljg5ODMtMi4wMDg1IDIuMDc4NiAzLjEzNTgtMy4xMDQ5IDYuMDUxMyA0LjEwNTItLjA1MTloNi4xMzE4eiIgZmlsbD0iI2Y1ODQxZiIgc3Ryb2tlPSIjZjU4NDFmIi8+PHBhdGggZD0ibTEwLjQ3MDUgMTQuNTE0OS02Ljg5ODI4IDIuMDA4NS0yLjI5OTQ0IDcuMTI2N2g2LjExODgzbDQuMTA1MTkuMDUxOS0zLjEwNDg3LTYuMDUxM3oiIGZpbGw9IiNmNTg0MWYiIHN0cm9rZT0iI2Y1ODQxZiIvPjxwYXRoIGQ9Im0xOS44MjQxIDE3Ljk4NzYuNDQxNy03LjU5MzIgMi4wMDA3LTUuNDAzNGgtOC45MTE5bDIuMDAwNiA1LjQwMzQuNDQxNyA3LjU5MzIuMTY4OSAyLjM4NDIuMDEzIDUuODk1OGgzLjY2MzVsLjAxMy01Ljg5NTh6IiBmaWxsPSIjZjU4NDFmIiBzdHJva2U9IiNmNTg0MWYiLz48L2c+PC9zdmc+",
    rdns: "io.metamask"
  })

  const detail: EIP6963ProviderDetail = Object.freeze({ info, provider })
  const event = new CustomEvent("eip6963:announceProvider", { detail })

  window.dispatchEvent(event)
}

function onAnnounceRequest(event: EIP6963RequestProviderEvent) {
  announceAsBrume()
  announceAsMetaMask()
}

window.addEventListener("eip6963:requestProvider", onAnnounceRequest, { passive: true })

announceAsBrume()
announceAsMetaMask()