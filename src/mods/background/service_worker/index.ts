import { FixedInit } from "@/libs/bigints/bigints"
import { browser, tryBrowser } from "@/libs/browser/browser"
import { ExtensionPort, Port, WebsitePort } from "@/libs/channel/channel"
import { chains, pairsByAddress } from "@/libs/ethereum/chain"
import { Mouse } from "@/libs/mouse/mouse"
import { RpcParamfulRequestInit, RpcParamfulRequestPreinit, RpcRequestInit, RpcRequestPreinit } from "@/libs/rpc"
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
import { None, Option, Optional, Some } from "@hazae41/option"
import { Cancel, Looped, Pool, Retry, tryLoop } from "@hazae41/piscine"
import { SuperEventTarget } from "@hazae41/plume"
import { Catched, Err, Ok, Panic, Result } from "@hazae41/result"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
import { Core, Data, IDBStorage, Makeable, RawState, SimpleFetcherfulQueryInstance, State } from "@hazae41/xswr"
import { ethers } from "ethers"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { EthereumBrume, EthereumBrumes, getEthereumBrumes } from "./entities/brumes/data"
import { EthereumSession, getEthereumSession } from "./entities/sessions/data"
import { getUsers } from "./entities/users/all/data"
import { User, UserData, UserInit, UserSession, getCurrentUser, getUser, tryCreateUser } from "./entities/users/data"
import { getWallets } from "./entities/wallets/all/data"
import { EthereumAuthPrivateKeyWallet, EthereumContext, EthereumPrivateKeyWallet, EthereumQueryKey, Wallet, WalletData, getEthereumBalance, getEthereumUnknown, getPairPrice, getWallet, tryEthereumFetch } from "./entities/wallets/data"
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
  port: Port
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
    "hello": (foreground: Port) => Result<void, Error>
    "data": (foreground: Port, request: RpcRequestPreinit<unknown>) => Result<void, Error>
  }>()

  readonly scripts = new Map<string, Set<Port>>()

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

      const { storage, hasher, crypter } = await tryCreateUserStorage(userData, password).then(r => r.throw(t))

      const currentUserData: UserSession = { user, storage, hasher, crypter }
      await currentUserQuery.mutate(Mutators.data(currentUserData))

      return new Ok(currentUserData)
    })
  }

  async tryWaitPopupHello(window: chrome.windows.Window) {
    const future = new Future<Result<Port, Error>>()

    const onRequest = (foreground: Port) => {
      future.resolve(new Ok(foreground))
      return new Some(Ok.void())
    }

    const onRemoved = (id: number) => {
      if (id !== window.id)
        return
      future.resolve(new Err(new Error()))
    }

    try {
      this.events.on("hello", onRequest, { passive: true })
      browser.windows.onRemoved.addListener(onRemoved)

      return await future.promise
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

      this.popup = { window, port: channel }

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

    const onData = (foreground: Port, request: RpcRequestPreinit<unknown>) => {
      if (foreground.uuid !== popup.port.uuid)
        return new None()
      if (request.method !== method)
        return new None()
      future.resolve(new Ok(request))
      return new Some(Ok.void())
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

  async getEthereumSession(script: Port): Promise<Optional<EthereumSession>> {
    const currentUser = await this.getCurrentUser()

    if (currentUser == null)
      return undefined

    const sessionQuery = await this.make(getEthereumSession(script.name, currentUser.storage))
    return sessionQuery.current?.inner
  }

  async tryGetOrWaitEthereumSession(script: Port, mouse: Mouse): Promise<Result<EthereumSession, Error>> {
    return await Result.unthrow(async t => {
      const session = await this.getEthereumSession(script)

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

      const sessionData: EthereumSession = { origin: script.name, wallet, chain }
      const sessionQuery = await this.make(getEthereumSession(script.name, storage))
      await sessionQuery.mutate(Mutators.data(sessionData))

      return new Ok(sessionData)
    })
  }

  async tryRouteContentScript(script: Port, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      if (request.method === "eth_requestAccounts")
        return await this.eth_requestAccounts(script, request, mouse)

      const { user, storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)
      const sessionQuery = await this.make(getEthereumSession(script.name, storage))
      const { wallet, chain } = Option.wrap(sessionQuery.current?.inner).ok().throw(t)

      const brumes = await this.#getOrCreateEthereumBrumes(wallet)

      const ethereum: EthereumContext = { user, port: script, wallet, chain, brumes }

      if (request.method === "eth_accounts")
        return await this.eth_accounts(ethereum, request)
      if (request.method === "eth_sendTransaction")
        return await this.eth_sendTransaction(ethereum, request, mouse)
      if (request.method === "personal_sign")
        return await this.personal_sign(ethereum, request, mouse)
      if (request.method === "eth_signTypedData_v4")
        return await this.eth_signTypedData_v4(ethereum, request, mouse)
      if (request.method === "wallet_switchEthereumChain")
        return await this.wallet_switchEthereumChain(ethereum, request, mouse)

      const query = await this.make(getEthereumUnknown(ethereum, request, storage))

      const result = await query.fetch().then(r => r.ignore())

      result.inspectSync(r => r.throw(t))

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, Error>(stored, { key: query.cacheKey })
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async eth_requestAccounts(script: Port, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<[string], Error>> {
    return await Result.unthrow(async t => {
      const sessionData = await this.tryGetOrWaitEthereumSession(script, mouse).then(r => r.throw(t))

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

  async tryGetPrivateKey(wallet: WalletData, foreground: Port): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      if (wallet.type === "privateKey")
        return new Ok(wallet.privateKey)

      const { crypter } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const { idBase64, ivBase64 } = wallet.privateKey

      const cipherBase64 = await foreground.tryRequest<string>({
        method: "brume_auth_get",
        params: [idBase64]
      }).then(r => r.throw(t).throw(t))

      const cipher = Bytes.fromBase64(cipherBase64)
      const iv = Bytes.fromBase64(ivBase64)
      const plain = await crypter.decrypt(cipher, iv)

      return new Ok(`0x${Bytes.toHex(plain)}`)
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

      const popup = Option.wrap(this.popup).ok().throw(t)

      const privateKey = await this.tryGetPrivateKey(wallet, popup.port).then(r => r.throw(t))

      const signature = await new ethers.Wallet(privateKey).signTransaction({
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

  async brume_eth_sendTransaction(foreground: Port, ethereum: EthereumContext, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
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

      const privateKey = await this.tryGetPrivateKey(wallet, foreground).then(r => r.throw(t))

      const signature = await new ethers.Wallet(privateKey).signTransaction({
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

  async personal_sign(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<string, Error>> {
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

      const popup = Option.wrap(this.popup).ok().throw(t)

      const privateKey = await this.tryGetPrivateKey(wallet, popup.port).then(r => r.throw(t))

      const signature = await new ethers.Wallet(privateKey).signMessage(Bytes.fromHexSafe(message))

      return new Ok(signature)
    })
  }

  async eth_signTypedData_v4(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<string, Error>> {
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

      const popup = Option.wrap(this.popup).ok().throw(t)

      const privateKey = await this.tryGetPrivateKey(wallet, popup.port).then(r => r.throw(t))

      const signature = await new ethers.Wallet(privateKey).signTypedData(domain, types, message)

      return new Ok(signature)
    })
  }

  async wallet_switchEthereumChain(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<void, Error>> {
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
      const sessionQuery = await this.make(getEthereumSession(ethereum.port.name, storage))
      await sessionQuery.mutate(Mutators.mapDataIfItExists(d => d.mapSync(d => ({ ...d, chain }))))

      for (const script of Option.wrap(this.scripts.get(ethereum.port.name)).unwrapOr([]))
        await script.tryRequest({ method: "chainChanged", params: [chainId] }).then(r => r.ignore())

      return Ok.void()
    })
  }

  async tryRouteForeground(foreground: Port, request: RpcRequestInit<unknown>): Promise<Option<Result<unknown, Error>>> {
    if (request.method === "brume_getPath")
      return new Some(await this.brume_getPath(request))
    if (request.method === "brume_setPath")
      return new Some(await this.brume_setPath(request))
    if (request.method === "brume_getUsers")
      return new Some(await this.brume_getUsers(request))
    if (request.method === "brume_newUser")
      return new Some(await this.brume_newUser(foreground, request))
    if (request.method === "brume_getUser")
      return new Some(await this.brume_getUser(request))
    if (request.method === "brume_setCurrentUser")
      return new Some(await this.brume_setCurrentUser(request))
    if (request.method === "brume_getCurrentUser")
      return new Some(await this.brume_getCurrentUser(request))
    if (request.method === "brume_getWallets")
      return new Some(await this.brume_getWallets(request))
    if (request.method === "brume_newWallet")
      return new Some(await this.brume_newWallet(foreground, request))
    if (request.method === "brume_getWallet")
      return new Some(await this.brume_getWallet(request))
    if (request.method === "brume_get_global")
      return new Some(await this.brume_get_global(request))
    if (request.method === "brume_get_user")
      return new Some(await this.brume_get_user(request))
    if (request.method === "brume_subscribe")
      return new Some(await this.brume_subscribe(foreground, request))
    if (request.method === "brume_eth_fetch")
      return new Some(await this.brume_eth_fetch(foreground, request))
    if (request.method === "brume_eth_index")
      return new Some(await this.brume_eth_index(foreground, request))
    if (request.method === "brume_eth_run")
      return new Some(await this.brume_eth_run(foreground, request))
    if (request.method === "brume_log")
      return new Some(await this.brume_log(request))
    if (request.method === "popup_hello")
      return new Some(await this.popup_hello(foreground, request))
    if (request.method === "brume_data")
      return new Some(await this.popup_data(foreground, request))
    return new None()
  }

  async brume_getPath(request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    return new Ok(this.#path)
  }

  async brume_setPath(request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [path] = (request as RpcParamfulRequestInit<[string]>).params

    this.#path = path

    return Ok.void()
  }

  async popup_hello(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      const returned = await this.events.emit("hello", [foreground])

      if (returned.isSome() && returned.inner.isErr())
        return returned.inner

      return Ok.void()
    })
  }

  async popup_data(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      const [subrequest] = (request as RpcParamfulRequestInit<[RpcRequestPreinit<unknown>]>).params

      const returned = await this.events.emit("data", [foreground, subrequest])

      if (returned.isSome() && returned.inner.isErr())
        return returned.inner

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

  async brume_newUser(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<User[], Error>> {
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

  async brume_newWallet(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<Wallet[], Error>> {
    return await Result.unthrow(async t => {
      const { storage, crypter } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const [auth, wallet] = (request as RpcParamfulRequestInit<[boolean, EthereumPrivateKeyWallet]>).params
      const walletsQuery = await this.make(getWallets(storage))

      if (!auth) {
        const walletsState = await walletsQuery.mutate(Mutators.pushData<Wallet, never>(new Data(wallet)))
        const wallets = Option.wrap(walletsState.current?.get()).ok().throw(t)

        return new Ok(wallets)
      }

      const plain = Bytes.fromHexSafe(wallet.privateKey.slice(2))
      const iv = Bytes.tryRandom(16).throw(t)
      const cipher = await crypter.encrypt(plain, iv)

      const ivBase64 = Bytes.toBase64(iv)
      const cipherBase64 = Bytes.toBase64(cipher)

      const idBase64 = await foreground.tryRequest<string>({
        method: "brume_auth_create",
        params: [wallet.name, cipherBase64]
      }).then(r => r.throw(t).throw(t))

      const authWallet: EthereumAuthPrivateKeyWallet = {
        ...wallet,
        type: "authPrivateKey",
        privateKey: { ivBase64, idBase64 }
      }

      const walletsState = await walletsQuery.mutate(Mutators.pushData<Wallet, never>(new Data(authWallet)))
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

  async brume_subscribe(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcParamfulRequestInit<[string]>).params

      const onState = async (event: CustomEvent<State<any, any>>) => {
        const stored = await this.core.store(event.detail, { key: cacheKey })

        await foreground.tryRequest({
          method: "brume_update",
          params: [cacheKey, stored]
        }).then(r => r.ignore())
      }

      this.core.onState.addListener(cacheKey, onState)

      foreground.events.on("close", () => {
        this.core.onState.removeListener(cacheKey, onState)
        return new None()
      })

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

  async brume_eth_index(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [walletId, chainId, subrequest] = (request as RpcParamfulRequestInit<[string, number, RpcRequestPreinit<unknown>]>).params

      const { user, storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(walletId, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)
      const chain = Option.wrap(chains[chainId]).ok().throw(t)

      const brumes = await this.#getOrCreateEthereumBrumes(wallet)

      const ethereum = { user, port: foreground, wallet, chain, brumes }

      const query = await this.routeAndMakeEthereum(ethereum, subrequest, storage).then(r => r.throw(t))

      await query.settings.indexer?.(query.state, { core: this.core })

      return Ok.void()
    })
  }

  async brume_eth_fetch(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [walletId, chainId, subrequest] = (request as RpcParamfulRequestInit<[string, number, RpcRequestPreinit<unknown>]>).params

      const { user, storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(walletId, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)
      const chain = Option.wrap(chains[chainId]).ok().throw(t)

      const brumes = await this.#getOrCreateEthereumBrumes(wallet)

      const ethereum = { user, port: foreground, wallet, chain, brumes }

      const query = await this.routeAndMakeEthereum(ethereum, subrequest, storage).then(r => r.throw(t))

      const result = await query.fetch().then(r => r.ignore())

      result.inspectSync(r => r.throw(t))

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, Error>(stored, { key: query.cacheKey })
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async brume_eth_run(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [walletId, chainId, subrequest] = (request as RpcParamfulRequestInit<[string, number, RpcRequestPreinit<unknown>]>).params

      const { user, storage } = Option.wrap(await this.getCurrentUser()).ok().throw(t)

      const walletQuery = await this.make(getWallet(walletId, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)
      const chain = Option.wrap(chains[chainId]).ok().throw(t)

      const brumes = await this.#getOrCreateEthereumBrumes(wallet)

      const ethereum = { user, port: foreground, wallet, chain, brumes }

      if (subrequest.method === "eth_sendTransaction")
        return await this.brume_eth_sendTransaction(foreground, ethereum, subrequest)

      return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
    })
  }

  async brume_log(request: RpcRequestInit<unknown>): Promise<Result<void, Error>> {
    return await tryLoop(async (i) => {
      return await Result.unthrow<Result<void, Looped<Error>>>(async t => {
        const circuit = await Pool.takeCryptoRandom(this.circuits).then(r => r.mapErrSync(Retry.new).throw(t).result.get())

        const body = JSON.stringify({ method: "eth_getBalance", tor: true })
        await circuit.tryFetch("http://proxy.brume.money", { method: "POST", body }).then(r => r.mapErrSync(Cancel.new).throw(t))
        await circuit.destroy()

        return Ok.void()
      })
    })
  }

}

async function tryInit() {
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

const init = tryInit()

if (IS_WEBSITE) {

  const onSkipWaiting = (event: ExtendableMessageEvent) =>
    self.skipWaiting()

  const onHelloWorld = async (event: ExtendableMessageEvent) => {
    const raw = event.ports[0]

    const channel = new WebsitePort("foreground", raw)

    channel.events.on("request", async (request) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      return await inited.get().tryRouteForeground(channel, request)
    })

    raw.start()

    await channel.tryRequest({ method: "brume_hello" }).then(r => r.ignore())
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
    const script = new ExtensionPort(port.name, port)

    script.events.on("request", async (request) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      const [subrequest, mouse] = (request as RpcParamfulRequestInit<[RpcRequestPreinit<unknown>, Mouse]>).params
      return new Some(await inited.get().tryRouteContentScript(script, subrequest, mouse))
    })

    init.then(inited => inited.inspectSync(global => {
      let scripts = global.scripts.get(script.name)

      if (scripts == null) {
        scripts = new Set()
        global.scripts.set(script.name, scripts)
      }

      script.events.on("close", () => {
        scripts?.delete(script)
        return new None()
      })

      scripts.add(script)
    }))
  }

  const onForeground = (port: chrome.runtime.Port) => {
    const channel = new ExtensionPort("foreground", port)

    channel.events.on("request", async (request) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      return await inited.get().tryRouteForeground(channel, request)
    })
  }

  browser.runtime.onConnect.addListener(port => {
    if (port.name === "foreground")
      return void onForeground(port)
    return void onContentScript(port)
  })

}