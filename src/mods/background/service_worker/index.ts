import { FixedInit } from "@/libs/bigints/bigints"
import { browser, tryBrowser, tryBrowserSync } from "@/libs/browser/browser"
import { ExtensionPort, Port, WebsitePort } from "@/libs/channel/channel"
import { chains, pairsByAddress } from "@/libs/ethereum/chain"
import { Mouse } from "@/libs/mouse/mouse"
import { RpcParamfulRequestInit, RpcParamfulRequestPreinit, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { createTorPool, tryCreateTor } from "@/libs/tor/tors/tors"
import { qurl } from "@/libs/url/url"
import { Mutators } from "@/libs/xswr/mutators"
import { Berith } from "@hazae41/berith"
import { Bytes } from "@hazae41/bytes"
import { Circuit, Fallback, TorClientDuplex } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Future } from "@hazae41/future"
import { Morax } from "@hazae41/morax"
import { Mutex } from "@hazae41/mutex"
import { Option, Optional } from "@hazae41/option"
import { Cancel, Looped, Pool, Retry, tryLoop } from "@hazae41/piscine"
import { SuperEventTarget } from "@hazae41/plume"
import { Catched, Err, Ok, Panic, Result } from "@hazae41/result"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
import { Core, Data, IDBStorage, Makeable, RawState, SimpleFetcherfulQueryInstance, State } from "@hazae41/xswr"
import { ethers } from "ethers"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { EthereumBrume, EthereumBrumes, getEthereumBrumes } from "./entities/sessions/data"
import { getUsers } from "./entities/users/all/data"
import { User, UserData, UserInit, UserSession, getCurrentUser, getUser, tryCreateUser } from "./entities/users/data"
import { getWallets } from "./entities/wallets/all/data"
import { EthereumContext, EthereumPrivateKeyWallet, EthereumQueryKey, EthereumSession, Wallet, WalletData, getEthereumBalance, getEthereumSession, getEthereumUnknown, getPairPrice, getWallet, tryEthereumFetch } from "./entities/wallets/data"
import { tryCreateUserStorage } from "./storage"

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_PRODUCTION?: boolean,
  }
}

declare const self: ServiceWorkerGlobalScope

const IS_EXTENSION = location.protocol.endsWith("extension:")
const IS_WEBSITE = !IS_EXTENSION

const IS_CHROME_EXTENSION = location.protocol === "chrome-extension:"
const IS_FIREFOX_EXTENSION = location.protocol === "moz-extension:"
const IS_SAFARI_EXTENSION = location.protocol === "safari-web-extension:"

if (IS_WEBSITE && self.__WB_PRODUCTION) {
  clientsClaim()
  precacheAndRoute(self.__WB_MANIFEST)

  self.addEventListener("message", (event) => {
    if (event.data !== "SKIP_WAITING")
      return
    self.skipWaiting()
  })
}

async function tryFetch<T>(url: string): Promise<Result<T, Error>> {
  try {
    const res = await fetch(url)

    if (!res.ok)
      return new Err(new Error(await res.text()))
    return new Ok(await res.json() as T)
  } catch (e: unknown) {
    return new Err(Catched.from(e))
  }
}

const FALLBACKS_URL = "https://raw.githubusercontent.com/hazae41/echalote/master/tools/fallbacks/fallbacks.json"

export interface PasswordData {
  uuid?: string
  password?: string
}

export interface PopupData {
  window: chrome.windows.Window,
  channel: Port
}

export class UserRejectionError extends Error {
  readonly #class = UserRejectionError
  readonly name = this.#class.name

  constructor() {
    super(`User rejected the request`)
  }

  static new() {
    return new UserRejectionError()
  }

}

export class Global {

  readonly core = new Core({})

  readonly events = new SuperEventTarget<{
    "hello": [Port, Future<Result<void, Error>>]
    "data": [Port, RpcRequestPreinit<unknown>]
  }>()

  readonly popupMutex = new Mutex(undefined)

  popup?: PopupData

  #path: string = "/"

  constructor(
    readonly tors: Mutex<Pool<TorClientDuplex, Error>>,
    readonly circuits: Mutex<Pool<Circuit, Error>>,
    readonly brumes: Mutex<Pool<EthereumBrume, Error>>,
    readonly storage: IDBStorage
  ) { }

  async make<T>(makeable: Makeable<T>) {
    return await makeable.make(this.core)
  }

  async tryGetStoredPassword(): Promise<Result<PasswordData, Error>> {
    if (IS_FIREFOX_EXTENSION) {
      const uuid = sessionStorage.getItem("uuid") ?? undefined
      const password = sessionStorage.getItem("password") ?? undefined
      return new Ok({ uuid, password })
    }

    return await tryBrowser(() => browser.storage.session.get(["uuid", "password"]))
  }

  async trySetStoredPassword(uuid: string, password: string) {
    if (IS_FIREFOX_EXTENSION) {
      sessionStorage.setItem("uuid", uuid)
      sessionStorage.setItem("password", password)
      return new Ok({ uuid, password })
    }

    return await tryBrowser(() => browser.storage.session.set({ uuid, password }))
  }

  async tryInit(): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      if (IS_EXTENSION) {
        const { uuid, password } = await this.tryGetStoredPassword().then(r => r.throw(t))
        await this.trySetCurrentUser(uuid, password).then(r => r.throw(t))
      }

      return Ok.void()
    })
  }

  async getCurrentUser(): Promise<Optional<UserSession>> {
    const currentUserQuery = await this.make(getCurrentUser())
    return currentUserQuery.current?.inner
  }

  async trySetCurrentUser(uuid: Optional<string>, password: Optional<string>): Promise<Result<Optional<UserSession>, Error>> {
    return await Result.unthrow(async t => {
      if (uuid == null)
        return new Ok(undefined)
      if (password == null)
        return new Ok(undefined)

      const currentUserQuery = await this.make(getCurrentUser())

      const userQuery = await this.make(getUser(uuid, this.storage))
      const userData = Option.wrap(userQuery.current?.get()).ok().throw(t)

      const user: User = { ref: true, uuid: userData.uuid }
      const storage = await tryCreateUserStorage(userData, password).then(r => r.throw(t))

      const currentUserData: UserSession = { user, storage }
      await currentUserQuery.mutate(Mutators.data(currentUserData))

      return new Ok(currentUserData)
    })
  }

  async tryWaitPopupHello(popup: chrome.windows.Window) {
    const request = new Future<Result<Port, Error>>()

    const onRequest = ([channel, response]: [Port, Future<Result<void, Error>>]) => {
      request.resolve(new Ok(channel))
      response.resolve(Ok.void())
      return Ok.void()
    }

    const onRemoved = (id: number) => {
      if (id !== popup.id)
        return
      request.resolve(new Err(new Error()))
    }

    try {
      this.events.on("hello", onRequest, { passive: true })
      browser.windows.onRemoved.addListener(onRemoved)

      return await request.promise
    } finally {
      this.events.off("hello", onRequest)
      browser.windows.onRemoved.removeListener(onRemoved)
    }
  }

  async tryOpenOrNavigatePopup(pathname: string, mouse: Mouse): Promise<Result<PopupData, Error>> {
    return await Result.unthrow(async t => {
      if (this.popup != null) {
        const windowId = Option.wrap(this.popup.window.id).ok().throw(t)
        const tabId = Option.wrap(this.popup.window.tabs?.[0].id).ok().throw(t)

        await tryBrowser(async () => {
          return await browser.tabs.update(tabId, { url: `popup.html#${pathname}`, highlighted: true })
        }).then(r => r.throw(t))

        await tryBrowser(async () => {
          return await browser.windows.update(windowId, { focused: true })
        }).then(r => r.throw(t))

        return new Ok(this.popup)
      }

      const height = 630
      const width = 400

      const top = Math.max(mouse.y - (height / 2), 0)
      const left = Math.max(mouse.x - (width / 2), 0)

      const window = await tryBrowser(async () => {
        return await browser.windows.create({ type: "popup", url: `popup.html#${pathname}`, state: "normal", height, width, top, left })
      }).then(r => r.throw(t))

      const channel = await this.tryWaitPopupHello(window).then(r => r.throw(t))

      this.popup = { window, channel }

      const onRemoved = () => {
        this.popup = undefined

        browser.windows.onRemoved.removeListener(onRemoved)
      }

      browser.windows.onRemoved.addListener(onRemoved)

      return new Ok(this.popup)
    })
  }

  async tryWaitPopupData(popup: PopupData, method: string) {
    const future = new Future<Result<RpcRequestPreinit<unknown>, Error>>()

    const onData = ([channel, request]: [Port, RpcRequestPreinit<unknown>]) => {
      if (channel.uuid !== popup.channel.uuid)
        return Ok.void()
      if (request.method !== method)
        return Ok.void()
      future.resolve(new Ok(request))
      return Ok.void()
    }

    const onRemoved = (id: number) => {
      if (id !== popup.window.id)
        return
      future.resolve(new Err(new Error()))
    }

    try {
      this.events.on("data", onData, { passive: true })
      browser.windows.onRemoved.addListener(onRemoved)

      return await future.promise
    } finally {
      this.events.off("data", onData)
      browser.windows.onRemoved.removeListener(onRemoved)
    }
  }

  async getEthereumSession(origin: string): Promise<Optional<EthereumSession>> {
    const currentUser = await this.getCurrentUser()

    if (currentUser == null)
      return undefined

    const sessionQuery = await this.make(getEthereumSession(origin, currentUser.storage))
    return sessionQuery.current?.inner
  }

  async tryGetOrWaitEthereumSession(origin: string, mouse: Mouse): Promise<Result<EthereumSession, Error>> {
    return await Result.unthrow(async t => {
      const session = await this.getEthereumSession(origin)

      if (session != null)
        return new Ok(session)

      const data = await this.popupMutex.lock(async () => {
        const popup = await this.tryOpenOrNavigatePopup("/eth_requestAccounts", mouse).then(r => r.throw(t))
        const data = await this.tryWaitPopupData(popup, "eth_requestAccounts").then(r => r.throw(t))

        return new Ok(data)
      }).then(r => r.throw(t))

      const [walletId, chainId] = (data as RpcParamfulRequestPreinit<[string, number]>).params

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(walletId, storage))
      const wallet = Option.wrap(walletQuery.current?.inner).ok().throw(t)
      const chain = Option.wrap(chains[chainId]).ok().throw(t)

      const sessionData: EthereumSession = { wallet, chain }
      const sessionQuery = await this.make(getEthereumSession(origin, storage))
      await sessionQuery.mutate(Mutators.data(sessionData))

      return new Ok(sessionData)
    })
  }

  async tryRouteContentScript(script: ExtensionPort, request: RpcRequestInit<unknown>, mouse: Mouse): Promise<Result<unknown, Error>> {
    return Result.unthrow(async t => {
      const origin = script.port.name

      if (request.method === "brume_ping")
        return new Ok(undefined)
      if (request.method === "eth_requestAccounts")
        return await this.eth_requestAccounts(origin, request, mouse)

      const { user, storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)
      const sessionQuery = await this.make(getEthereumSession(origin, storage))
      const { wallet, chain } = Option.wrap(sessionQuery.current?.inner).ok().throw(t)

      const brumes = await this.#getOrCreateEthereumBrumes(wallet)

      const ethereum = { user, origin, wallet, chain, brumes }

      if (request.method === "eth_accounts")
        return await this.eth_accounts(ethereum, request)
      if (request.method === "eth_sendTransaction")
        return await this.eth_sendTransaction(ethereum, request, mouse)
      if (request.method === "personal_sign")
        return await this.personal_sign(ethereum, request, mouse)
      if (request.method === "eth_signTypedData_v4")
        return await this.eth_signTypedData_v4(ethereum, request, mouse)
      if (request.method === "wallet_switchEthereumChain")
        return await this.wallet_switchEthereumChain(ethereum, script, request, mouse)

      const query = await this.make(getEthereumUnknown(ethereum, request, storage))

      const result = await query.fetch().then(r => r.ignore())

      result.inspectSync(r => r.throw(t))

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, Error>(stored, { key: query.cacheKey })
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async eth_requestAccounts(origin: string, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<[string], Error>> {
    return await Result.unthrow(async t => {
      const sessionData = await this.tryGetOrWaitEthereumSession(origin, mouse).then(r => r.throw(t))

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)
      const walletQuery = await this.make(getWallet(sessionData.wallet.uuid, storage))
      const address = Option.wrap(walletQuery.current?.get().address).ok().throw(t)

      return new Ok([address])
    })
  }

  async eth_accounts(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>): Promise<Result<[string], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(ethereum.wallet.uuid, storage))
      const address = Option.wrap(walletQuery.current?.get().address).ok().throw(t)

      return new Ok([address])
    })
  }

  async makeEthereumBalance(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage): Promise<Result<SimpleFetcherfulQueryInstance<EthereumQueryKey<unknown>, FixedInit, Error>, Error>> {
    return await Result.unthrow(async t => {
      const [address, block] = (request as RpcParamfulRequestPreinit<[string, string]>).params

      const query = await this.make(getEthereumBalance(ethereum, address, block, storage))

      return new Ok(query)
    })
  }

  async eth_getBalance(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [address, block] = (request as RpcParamfulRequestPreinit<[string, string]>).params

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const query = await this.make(getEthereumBalance(ethereum, address, block, storage))

      const result = await query.fetch().then(r => r.ignore())

      result.inspectSync(r => r.throw(t))

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, any>(stored, { key: query.cacheKey })
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async makeEthereumPairPrice(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage): Promise<Result<SimpleFetcherfulQueryInstance<string, FixedInit, Error>, Error>> {
    return await Result.unthrow(async t => {
      const [address] = (request as RpcParamfulRequestPreinit<[string]>).params

      const pair = Option.wrap(pairsByAddress[address]).ok().throw(t)
      const query = await this.make(getPairPrice(ethereum, pair, storage))

      return new Ok(query)
    })
  }

  async eth_getPairPrice(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [address] = (request as RpcParamfulRequestPreinit<[string]>).params

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const pair = Option.wrap(pairsByAddress[address]).ok().throw(t)
      const query = await this.make(getPairPrice(ethereum, pair, storage))

      const result = await query.fetch().then(r => r.ignore())

      result.inspectSync(r => r.throw(t))

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, any>(stored, { key: query.cacheKey })
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async eth_sendTransaction(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [{ data, gas, from, to, value }] = (request as RpcParamfulRequestInit<[{ data: string, gas: string, from: string, to: string, value: string }]>).params

      const reply = await this.popupMutex.lock(async () => {
        const url = qurl(`/eth_sendTransaction`, { to, value, data })

        const popup = await this.tryOpenOrNavigatePopup(url, mouse).then(r => r.throw(t))
        const reply = await this.tryWaitPopupData(popup, "eth_sendTransaction").then(r => r.throw(t))

        return new Ok(reply)
      }).then(r => r.throw(t))

      const [approved] = (reply as RpcParamfulRequestPreinit<[boolean]>).params
      Result.assert(approved).mapErrSync(UserRejectionError.new).throw(t)

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(ethereum.wallet.uuid, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      const nonce = await tryEthereumFetch<string>(ethereum, {
        method: "eth_getTransactionCount",
        params: [wallet.address, "pending"]
      }).then(r => r.throw(t).throw(t))

      const gasPrice = await tryEthereumFetch<string>(ethereum, {
        method: "eth_gasPrice"
      }).then(r => r.throw(t).throw(t))

      const signature = await new ethers.Wallet(wallet.privateKey).signTransaction({
        data: data,
        to: to,
        from: from,
        gasLimit: gas,
        chainId: ethereum.chain.chainId,
        gasPrice: gasPrice,
        nonce: parseInt(nonce, 16),
        value: value
      })

      const signal = AbortSignal.timeout(600_000)

      return await tryEthereumFetch<string>(ethereum, {
        method: "eth_sendRawTransaction",
        params: [signature]
      }, { signal }).then(r => r.throw(t))
    })
  }

  async brume_eth_sendTransaction(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [{ data, gas, from, to, value }] = (request as RpcParamfulRequestInit<[{ data: string, gas: string, from: string, to: string, value: string }]>).params

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(ethereum.wallet.uuid, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      const nonce = await tryEthereumFetch<string>(ethereum, {
        method: "eth_getTransactionCount",
        params: [wallet.address, "pending"]
      }).then(r => r.throw(t).throw(t))

      const gasPrice = await tryEthereumFetch<string>(ethereum, {
        method: "eth_gasPrice"
      }).then(r => r.throw(t).throw(t))

      const signature = await new ethers.Wallet(wallet.privateKey).signTransaction({
        data: data,
        to: to,
        from: from,
        gasLimit: gas,
        chainId: ethereum.chain.chainId,
        gasPrice: gasPrice,
        nonce: parseInt(nonce, 16),
        value: value
      })

      const signal = AbortSignal.timeout(600_000)

      return await tryEthereumFetch<string>(ethereum, {
        method: "eth_sendRawTransaction",
        params: [signature]
      }, { signal }).then(r => r.throw(t))
    })
  }

  async personal_sign(ethereum: EthereumContext, request: RpcRequestInit<unknown>, mouse: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [message, address] = (request as RpcParamfulRequestInit<[string, string]>).params

      const reply = await this.popupMutex.lock(async () => {
        const popup = await this.tryOpenOrNavigatePopup(`/personal_sign?message=${message}`, mouse).then(r => r.throw(t))
        const reply = await this.tryWaitPopupData(popup, "personal_sign").then(r => r.throw(t))

        return new Ok(reply)
      }).then(r => r.throw(t))

      const [approved] = (reply as RpcParamfulRequestPreinit<[boolean]>).params
      Result.assert(approved).mapErrSync(UserRejectionError.new).throw(t)

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(ethereum.wallet.uuid, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      const signature = await new ethers.Wallet(wallet.privateKey).signMessage(Bytes.fromHexSafe(message))

      return new Ok(signature)
    })
  }

  async eth_signTypedData_v4(ethereum: EthereumContext, request: RpcRequestInit<unknown>, mouse: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [address, data] = (request as RpcParamfulRequestInit<[string, string]>).params

      const reply = await this.popupMutex.lock(async () => {
        const popup = await this.tryOpenOrNavigatePopup(`/eth_signTypedData_v4?message=${data}`, mouse).then(r => r.throw(t))
        const reply = await this.tryWaitPopupData(popup, "eth_signTypedData_v4").then(r => r.throw(t))

        return new Ok(reply)
      }).then(r => r.throw(t))

      const [approved] = (reply as RpcParamfulRequestPreinit<[boolean]>).params
      Result.assert(approved).mapErrSync(UserRejectionError.new).throw(t)

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(ethereum.wallet.uuid, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      const { domain, types, message } = JSON.parse(data)

      delete types["EIP712Domain"]

      const signature = await new ethers.Wallet(wallet.privateKey).signTypedData(domain, types, message)

      return new Ok(signature)
    })
  }

  async wallet_switchEthereumChain(ethereum: EthereumContext, script: ExtensionPort, request: RpcRequestInit<unknown>, mouse: Mouse): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [{ chainId }] = (request as RpcParamfulRequestInit<[{ chainId: string }]>).params

      const chain = Option.wrap(chains[parseInt(chainId, 16)]).ok().throw(t)

      const popup = await this.popupMutex.lock(async () => {
        const popup = await this.tryOpenOrNavigatePopup("/wallet_switchEthereumChain", mouse).then(r => r.throw(t))
        const data = await this.tryWaitPopupData(popup, "wallet_switchEthereumChain").then(r => r.throw(t))

        return new Ok(data)
      }).then(r => r.throw(t))

      const [approved] = (popup as RpcParamfulRequestPreinit<[boolean]>).params
      Result.assert(approved).mapErrSync(UserRejectionError.new).throw(t)

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)
      const sessionQuery = await this.make(getEthereumSession(ethereum.origin, storage))
      await sessionQuery.mutate(Mutators.mapDataIfItExists(d => d.mapSync(d => ({ ...d, chain }))))

      return Ok.void()
    })
  }

  async tryRouteForeground(channel: Port, request: RpcRequestInit<unknown>): Promise<Result<unknown, Error>> {
    if (request.method === "brume_ping")
      return new Ok(undefined)
    if (request.method === "brume_getPath")
      return await this.brume_getPath(request)
    if (request.method === "brume_setPath")
      return await this.brume_setPath(request)
    if (request.method === "brume_getUsers")
      return await this.brume_getUsers(request)
    if (request.method === "brume_newUser")
      return await this.brume_newUser(channel, request)
    if (request.method === "brume_getUser")
      return await this.brume_getUser(request)
    if (request.method === "brume_setCurrentUser")
      return await this.brume_setCurrentUser(request)
    if (request.method === "brume_getCurrentUser")
      return await this.brume_getCurrentUser(request)
    if (request.method === "brume_getWallets")
      return await this.brume_getWallets(request)
    if (request.method === "brume_newWallet")
      return await this.brume_newWallet(request)
    if (request.method === "brume_getWallet")
      return await this.brume_getWallet(request)
    if (request.method === "brume_get_global")
      return await this.brume_get_global(request)
    if (request.method === "brume_get_user")
      return await this.brume_get_user(request)
    if (request.method === "brume_subscribe")
      return await this.brume_subscribe(channel, request)
    if (request.method === "brume_eth_fetch")
      return await this.brume_eth_fetch(request)
    if (request.method === "brume_eth_index")
      return await this.brume_eth_index(request)
    if (request.method === "brume_eth_run")
      return await this.brume_eth_run(request)
    if (request.method === "brume_log")
      return await this.brume_log(request)
    if (request.method === "brume_hello")
      return await this.brume_hello(channel, request)
    if (request.method === "brume_data")
      return await this.brume_data(channel, request)
    return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
  }

  async brume_ping(request: RpcRequestPreinit<unknown>) {
    return Ok.void()
  }

  async brume_getPath(request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    return new Ok(this.#path)
  }

  async brume_setPath(request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [path] = (request as RpcParamfulRequestInit<[string]>).params

    this.#path = path

    return Ok.void()
  }

  async brume_hello(channel: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      const response = new Future<Result<void, Error>>()

      await this.events.tryEmit("hello", [channel, response]).then(r => r.throw(t))

      return await response.promise
    })
  }

  async brume_data(channel: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      const [subrequest] = (request as RpcParamfulRequestInit<[RpcRequestPreinit<unknown>]>).params

      await this.events.tryEmit("data", [channel, subrequest]).then(r => r.throw(t))

      return Ok.void()
    })
  }

  async brume_getUsers(request: RpcRequestPreinit<unknown>): Promise<Result<User[], never>> {
    return await Result.unthrow(async t => {
      const usersQuery = await this.make(getUsers(this.storage))
      const users = usersQuery?.current?.get() ?? []

      return new Ok(users)
    })
  }

  async brume_newUser(channel: Port, request: RpcRequestPreinit<unknown>): Promise<Result<User[], Error>> {
    return await Result.unthrow(async t => {
      const [init] = (request as RpcParamfulRequestInit<[UserInit]>).params

      const usersQuery = await this.make(getUsers(this.storage))
      const user = await tryCreateUser(init).then(r => r.throw(t))

      const usersState = await usersQuery.mutate(Mutators.pushData<User, never>(new Data(user)))
      const users = Option.wrap(usersState.current?.get()).ok().throw(t)

      return new Ok(users)
    })
  }

  async brume_getUser(request: RpcRequestPreinit<unknown>): Promise<Result<UserData, Error>> {
    return await Result.unthrow(async t => {
      const [uuid] = (request as RpcParamfulRequestInit<[string]>).params

      const userQuery = await this.make(getUser(uuid, this.storage))
      const user = Option.wrap(userQuery.current?.get()).ok().throw(t)

      return new Ok(user)
    })
  }

  async brume_setCurrentUser(request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [uuid, password] = (request as RpcParamfulRequestInit<[string, string]>).params

      await this.trySetCurrentUser(uuid, password).then(r => r.throw(t))

      if (IS_EXTENSION)
        await this.trySetStoredPassword(uuid, password).then(r => r.throw(t))

      return Ok.void()
    })
  }

  async brume_getCurrentUser(request: RpcRequestPreinit<unknown>): Promise<Result<Optional<UserData>, Error>> {
    return await Result.unthrow(async t => {
      const userSession = await this.getCurrentUser()

      if (userSession == null)
        return new Ok(undefined)

      const userQuery = await this.make(getUser(userSession.user.uuid, this.storage))

      return new Ok(userQuery.current?.inner)
    })
  }

  async brume_getWallets(request: RpcRequestPreinit<unknown>): Promise<Result<Wallet[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletsQuery = await this.make(getWallets(storage))
      const wallets = walletsQuery.current?.get() ?? []

      return new Ok(wallets)
    })
  }

  async brume_newWallet(request: RpcRequestPreinit<unknown>): Promise<Result<Wallet[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const [wallet] = (request as RpcParamfulRequestInit<[EthereumPrivateKeyWallet]>).params
      const walletsQuery = await this.make(getWallets(storage))

      const walletsState = await walletsQuery.mutate(Mutators.pushData<Wallet, never>(new Data(wallet)))
      const wallets = Option.wrap(walletsState.current?.get()).ok().throw(t)

      return new Ok(wallets)
    })
  }

  async brume_getWallet(request: RpcRequestPreinit<unknown>): Promise<Result<WalletData, Error>> {
    return await Result.unthrow(async t => {
      const [uuid] = (request as RpcParamfulRequestInit<[string]>).params

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(uuid, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      return new Ok(wallet)
    })
  }

  async #getOrCreateEthereumBrumes(wallet: Wallet): Promise<EthereumBrumes> {
    const brumesQuery = await this.make(getEthereumBrumes(wallet))

    if (brumesQuery.current != null)
      return brumesQuery.current.inner

    const brumes = EthereumBrume.createSubpool(this.brumes, { capacity: 3 })
    await brumesQuery.mutate(Mutators.data(brumes))
    return brumes
  }

  async brume_get_global(request: RpcRequestPreinit<unknown>): Promise<Result<Optional<RawState>, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcParamfulRequestInit<[string]>).params

      const cached = this.core.raw.get(cacheKey)

      if (cached != null)
        return new Ok(cached.inner)

      const stored = await this.storage.get(cacheKey)
      this.core.raw.set(cacheKey, Option.wrap(stored))

      return new Ok(stored)
    })
  }

  async brume_get_user(request: RpcRequestPreinit<unknown>): Promise<Result<Optional<RawState>, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcParamfulRequestInit<[string]>).params

      const { storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const cached = this.core.raw.get(cacheKey)

      if (cached != null)
        return new Ok(cached.inner)

      const stored = await storage.get(cacheKey)
      this.core.raw.set(cacheKey, Option.wrap(stored))

      return new Ok(stored)
    })
  }

  async brume_subscribe(channel: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcParamfulRequestInit<[string]>).params

      const onState = async (event: CustomEvent<State<any, any>>) => {
        const stored = await this.core.store(event.detail, { key: cacheKey })

        channel.trySend({
          method: "brume_update",
          params: [cacheKey, stored]
        }).ignore()
      }

      this.core.onState.addListener(cacheKey, onState)

      const onClose = () => {
        this.core.onState.removeListener(cacheKey, onState)
      }

      channel.onClose(onClose)

      return Ok.void()
    })
  }

  async makeEthereumUnknown(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
    return new Ok(await this.make(getEthereumUnknown(ethereum, request, storage)))
  }

  async routeAndMakeEthereum(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage): Promise<Result<SimpleFetcherfulQueryInstance<any, FixedInit, Error>, Error>> {
    if (request.method === "eth_getBalance")
      return await this.makeEthereumBalance(ethereum, request, storage)
    if (request.method === "eth_getPairPrice")
      return await this.makeEthereumPairPrice(ethereum, request, storage)
    return await this.makeEthereumUnknown(ethereum, request, storage)
  }

  async brume_eth_index(request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [walletId, chainId, subrequest] = (request as RpcParamfulRequestInit<[string, number, RpcRequestPreinit<unknown>]>).params

      const { user, storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(walletId, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)
      const chain = Option.wrap(chains[chainId]).ok().throw(t)

      const brumes = await this.#getOrCreateEthereumBrumes(wallet)

      const ethereum = { user, origin: "foreground", wallet, chain, brumes }

      const query = await this.routeAndMakeEthereum(ethereum, subrequest, storage).then(r => r.throw(t))

      await query.settings.indexer?.(query.state, { core: this.core })

      return Ok.void()
    })
  }

  async brume_eth_fetch(request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [walletId, chainId, subrequest] = (request as RpcParamfulRequestInit<[string, number, RpcRequestPreinit<unknown>]>).params

      const { user, storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(walletId, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)
      const chain = Option.wrap(chains[chainId]).ok().throw(t)

      const brumes = await this.#getOrCreateEthereumBrumes(wallet)

      const ethereum = { user, origin: "foreground", wallet, chain, brumes }

      const query = await this.routeAndMakeEthereum(ethereum, subrequest, storage).then(r => r.throw(t))

      const result = await query.fetch().then(r => r.ignore())

      result.inspectSync(r => r.throw(t))

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, Error>(stored, { key: query.cacheKey })
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async brume_eth_run(request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [walletId, chainId, subrequest] = (request as RpcParamfulRequestInit<[string, number, RpcRequestPreinit<unknown>]>).params

      const { user, storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(walletId, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)
      const chain = Option.wrap(chains[chainId]).ok().throw(t)

      const brumes = await this.#getOrCreateEthereumBrumes(wallet)

      const ethereum = { user, origin: "foreground", wallet, chain, brumes }

      if (subrequest.method === "eth_sendTransaction")
        return await this.brume_eth_sendTransaction(ethereum, subrequest)

      return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
    })
  }

  async brume_log(request: RpcRequestInit<unknown>): Promise<Result<void, Error>> {
    return await tryLoop(async (i) => {
      return await Result.unthrow<Result<void, Looped<Error>>>(async t => {
        const circuit = await Pool.takeCryptoRandom(this.circuits).then(r => r.mapErrSync(Retry.new).throw(t).result.get())

        const body = JSON.stringify({ method: "eth_getBalance", tor: true })
        await circuit.tryFetch("http://proxy.brume.money", { method: "POST", body }).then(r => r.mapErrSync(Cancel.new).throw(t))
        await circuit.tryDestroy().then(r => r.mapErrSync(Cancel.new).throw(t))

        return Ok.void()
      })
    })
  }

}

async function init() {
  return await Result.recatch(async () => {
    return await Result.unthrow<Result<Global, Error>>(async t => {
      await Berith.initBundledOnce()
      await Morax.initBundledOnce()

      const ed25519 = Ed25519.fromBerith(Berith)
      const x25519 = X25519.fromBerith(Berith)
      const sha1 = Sha1.fromMorax(Morax)

      const fallbacks = await tryFetch<Fallback[]>(FALLBACKS_URL).then(r => r.throw(t))

      const tors = createTorPool(async () => {
        return await tryCreateTor({ fallbacks, ed25519, x25519, sha1 })
      }, { capacity: 3 })

      const circuits = Circuits.createPool(tors, { capacity: 9 })
      const sessions = EthereumBrume.createPool(chains, circuits, { capacity: 9 })

      const storage = IDBStorage.tryCreate({ name: "memory" }).unwrap()
      const global = new Global(tors, circuits, sessions, storage)

      await global.tryInit().then(r => r.throw(t))

      return new Ok(global)
    })
  })
}

const inited = init()

if (IS_WEBSITE) {

  const onSkipWaiting = (event: ExtendableMessageEvent) =>
    self.skipWaiting()

  const onHelloWorld = async (event: ExtendableMessageEvent) => {
    const port = event.ports[0]

    const channel = new WebsitePort(port)

    port.addEventListener("message", async (event: MessageEvent<RpcRequestInit<unknown> | RpcResponseInit<unknown>>) => {
      if (!("method" in event.data))
        return

      const request = event.data

      if (request.id !== "ping")
        console.log("foreground", "->", request)

      const result = await inited.then(r => r.andThenSync(g => g.tryRouteForeground(channel, request)))
      const response = RpcResponse.rewrap(request.id, result)

      if (request.id !== "ping")
        console.log("foreground", "<-", response)

      Result.catchAndWrapSync(() => port.postMessage(response)).ignore()
    })

    port.postMessage({ id: "hello", method: "brume_hello" })

    port.start()
  }

  self.addEventListener("message", (event) => {
    if (event.data === "SKIP_WAITING")
      return void onSkipWaiting(event)
    if (event.data === "HELLO_WORLD")
      return void onHelloWorld(event)
    throw new Panic(`Invalid message`)
  })
}

if (IS_EXTENSION) {

  const onContentScript = (port: chrome.runtime.Port) => {
    const channel = new ExtensionPort(port)

    port.onMessage.addListener(async (message: {
      request: RpcRequestInit<unknown>
      mouse: Mouse
    }) => {
      const { request, mouse } = message

      if (request.id !== "ping")
        console.log(port.name, "->", request)

      const result = await inited.then(r => r.andThenSync(g => g.tryRouteContentScript(channel, request, mouse)))
      const response = RpcResponse.rewrap(request.id, result)

      if (request.id !== "ping")
        console.log(port.name, "<-", response)

      tryBrowserSync(() => port.postMessage(response)).ignore()
    })
  }

  const onForeground = (port: chrome.runtime.Port) => {
    const channel = new ExtensionPort(port)

    port.onMessage.addListener(async (message: RpcRequestInit<unknown> | RpcResponseInit<unknown>) => {
      if (!("method" in message))
        return

      if (message.id !== "ping")
        console.log(port.name, "->", message)

      const result = await inited.then(r => r.andThenSync(g => g.tryRouteForeground(channel, message)))
      const response = RpcResponse.rewrap(message.id, result)

      if (message.id !== "ping")
        console.log(port.name, "<-", response)

      tryBrowserSync(() => port.postMessage(response)).ignore()
    })
  }

  browser.runtime.onConnect.addListener(port => {
    if (port.name === "foreground")
      return void onForeground(port)
    return void onContentScript(port)
  })

}