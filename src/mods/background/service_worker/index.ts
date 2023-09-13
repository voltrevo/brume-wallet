import "@hazae41/symbol-dispose-polyfill"

import { FixedInit } from "@/libs/bigints/bigints"
import { browser, tryBrowser } from "@/libs/browser/browser"
import { ExtensionPort, Port, WebsitePort } from "@/libs/channel/channel"
import { chainByChainId, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain"
import { Mouse } from "@/libs/mouse/mouse"
import { RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { createTorPool, tryCreateTor } from "@/libs/tor/tors/tors"
import { Url, qurl } from "@/libs/url/url"
import { IrnClient } from "@/libs/wconn/mods/irn/irn"
import { Wc, WcMetadata, WcSessionRequestParams } from "@/libs/wconn/mods/wc/wc"
import { Mutators } from "@/libs/xswr/mutators"
import { Base16 } from "@hazae41/base16"
import { Base58 } from "@hazae41/base58"
import { Base64 } from "@hazae41/base64"
import { Base64Url } from "@hazae41/base64url"
import { Bytes } from "@hazae41/bytes"
import { ChaCha20Poly1305 } from "@hazae41/chacha20poly1305"
import { Disposer } from "@hazae41/cleaner"
import { Circuit, Fallback, TorClientDuplex } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Future } from "@hazae41/future"
import { Keccak256 } from "@hazae41/keccak256"
import { Mutex } from "@hazae41/mutex"
import { None, Option, Optional, Some } from "@hazae41/option"
import { Cancel, Looped, Pool, Retry, tryLoop } from "@hazae41/piscine"
import { SuperEventTarget } from "@hazae41/plume"
import { Catched, Err, Ok, Panic, Result } from "@hazae41/result"
import { Ripemd160 } from "@hazae41/ripemd160"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
import { Core, IDBStorage, RawState, SimpleFetcherfulQueryInstance, State } from "@hazae41/xswr"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { EthBrume, EthBrumes, WcBrume, WcBrumes } from "./entities/brumes/data"
import { Origin, OriginData } from "./entities/origins/data"
import { AppRequest, AppRequestData } from "./entities/requests/data"
import { Seed, SeedData } from "./entities/seeds/data"
import { ExSessionData, PersistentSession, SessionData, TemporarySession, WcSessionData } from "./entities/sessions/data"
import { Users } from "./entities/users/all/data"
import { User, UserData, UserInit, UserSession, getCurrentUser } from "./entities/users/data"
import { EthereumContext, EthereumQueryKey, Wallet, WalletData, WalletRef, getBalance, getEthereumUnknown, getPairPrice, getTokenBalance, tryEthereumFetch } from "./entities/wallets/data"
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

export interface Slot<T> {
  current?: T
}

export class Global {

  readonly core = new Core({})

  readonly events = new SuperEventTarget<{
    "popup_hello": (foreground: Port) => Result<void, Error>
    "response": (response: RpcResponseInit<unknown>) => Result<void, Error>
  }>()

  #user?: UserSession
  #path: string = "/"

  readonly circuits: Mutex<Pool<Disposer<Circuit>, Error>>
  readonly walletconnect: Mutex<Pool<Disposer<WcBrume>, Error>>
  readonly ethereum: Mutex<Pool<Disposer<EthBrume>, Error>>

  /**
   * Scripts by session
   */
  readonly scriptsBySession = new Map<string, Set<Port>>()

  /**
   * Session by script
   */
  readonly sessionByScript = new Map<string, string>()

  /**
   * Current popup
   */
  readonly popup = new Mutex<Slot<PopupData>>({})

  constructor(
    readonly tors: Mutex<Pool<Disposer<TorClientDuplex>, Error>>,
    readonly storage: IDBStorage
  ) {
    this.circuits = Circuits.createPool(this.tors, { capacity: 9 })
    this.ethereum = EthBrumes.createPool(chainByChainId, this.circuits, { capacity: 9 })
    this.walletconnect = WcBrumes.createPool(this.circuits, { capacity: 3 })
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

  async trySetCurrentUser(uuid: Optional<string>, password: Optional<string>): Promise<Result<Optional<UserSession>, Error>> {
    return await Result.unthrow(async t => {
      if (uuid == null)
        return new Ok(undefined)
      if (password == null)
        return new Ok(undefined)

      const userQuery = await User.schema(uuid, this.storage).make(this.core)
      const userData = Option.wrap(userQuery.current?.get()).ok().throw(t)

      const user: User = { ref: true, uuid: userData.uuid }

      const { storage, hasher, crypter } = await tryCreateUserStorage(userData, password).then(r => r.throw(t))

      const currentUserQuery = await getCurrentUser().make(this.core)
      await currentUserQuery.mutate(Mutators.data<User, never>(user))

      const userSession: UserSession = { user, storage, hasher, crypter }

      this.#user = userSession

      return new Ok(userSession)
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
      this.events.on("popup_hello", onRequest, { passive: true })
      browser.windows.onRemoved.addListener(onRemoved)

      return await future.promise
    } finally {
      this.events.off("popup_hello", onRequest)
      browser.windows.onRemoved.removeListener(onRemoved)
    }
  }

  async tryOpenOrFocusPopup(pathname: string, mouse: Mouse): Promise<Result<PopupData, Error>> {
    return await Result.unthrow(async t => {
      return await this.popup.lock(async (slot) => {
        if (slot.current != null) {
          const windowId = Option.wrap(slot.current.window.id).ok().throw(t)
          const tabId = Option.wrap(slot.current.window.tabs?.[0].id).ok().throw(t)

          await tryBrowser(async () => {
            return await browser.tabs.update(tabId, { highlighted: true })
          }).then(r => r.throw(t))

          await tryBrowser(async () => {
            return await browser.windows.update(windowId, { focused: true })
          }).then(r => r.throw(t))

          return new Ok(slot.current)
        }

        const height = 630
        const width = 400

        const top = Math.max(mouse.y - (height / 2), 0)
        const left = Math.max(mouse.x - (width / 2), 0)

        const window = await tryBrowser(async () => {
          return await browser.windows.create({ type: "popup", url: `popup.html#${pathname}`, state: "normal", height, width, top, left })
        }).then(r => r.throw(t))

        const channel = await this.tryWaitPopupHello(window).then(r => r.throw(t))

        slot.current = { window, port: channel }

        const onRemoved = () => {
          slot.current = undefined

          browser.windows.onRemoved.removeListener(onRemoved)
        }

        browser.windows.onRemoved.addListener(onRemoved)

        return new Ok(slot.current)
      })
    })
  }

  async tryRequest<T>(request: AppRequestData, mouse?: Mouse): Promise<Result<RpcResponse<T>, Error>> {
    if (mouse != null)
      return await this.tryRequestPopup(request, mouse)
    return await this.tryRequestNoPopup(request)
  }

  async tryRequestNoPopup<T>(request: AppRequestData): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const requestQuery = await AppRequest.schema(request.id).make(this.core)
      await requestQuery.mutate(Mutators.data<AppRequestData, never>(request))

      try {
        return await this.tryWaitResponse(request.id)
      } finally {
        await requestQuery.delete()
      }
    })
  }

  async tryRequestPopup<T>(request: AppRequestData, mouse: Mouse): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const requestQuery = await AppRequest.schema(request.id).make(this.core)
      await requestQuery.mutate(Mutators.data<AppRequestData, never>(request))

      try {
        const { id, method, params } = request
        const url = qurl(`/${method}?id=${id}`, params)

        const popup = await this.tryOpenOrFocusPopup(url, mouse).then(r => r.throw(t))
        const response = await this.tryWaitPopupResponse<T>(request.id, popup).then(r => r.throw(t))

        return new Ok(response)
      } finally {
        await requestQuery.delete()
      }
    })
  }

  async tryWaitResponse<T>(id: string) {
    const future = new Future<Result<RpcResponse<T>, Error>>()

    const onResponse = (init: RpcResponseInit<any>) => {
      if (init.id !== id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(new Ok(response))
      return new Some(Ok.void())
    }

    try {
      this.events.on("response", onResponse, { passive: true })

      return await future.promise
    } finally {
      this.events.off("response", onResponse)
    }
  }

  async tryWaitPopupResponse<T>(id: string, popup: PopupData) {
    const future = new Future<Result<RpcResponse<T>, Error>>()

    const onResponse = (init: RpcResponseInit<any>) => {
      if (init.id !== id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(new Ok(response))
      return new Some(Ok.void())
    }

    const onRemoved = (id: number) => {
      if (id !== popup.window.id)
        return
      future.resolve(new Err(new Error()))
    }

    try {
      this.events.on("response", onResponse, { passive: true })
      browser.windows.onRemoved.addListener(onRemoved)

      return await future.promise
    } finally {
      this.events.off("response", onResponse)
      browser.windows.onRemoved.removeListener(onRemoved)
    }
  }

  async tryGetOrWaitExtensionSession(script: Port, mouse: Mouse): Promise<Result<SessionData, Error>> {
    return await Result.unthrow(async t => {
      const currentSession = this.sessionByScript.get(script.name)

      if (currentSession != null) {
        const tempSessionQuery = await TemporarySession.schema(currentSession).make(this.core)
        const tempSessionData = Option.wrap(tempSessionQuery.data?.inner).ok().throw(t)

        return new Ok(tempSessionData)
      }

      const originData = await script.tryRequest<OriginData>({
        method: "brume_origin"
      }).then(r => r.throw(t).throw(t))

      if (this.#user == null)
        await this.tryOpenOrFocusPopup("/", mouse).then(r => r.throw(t))

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const persSessionQuery = await PersistentSession.schema(originData.origin, storage).make(this.core)
      const maybePersSession = persSessionQuery.data?.inner

      if (maybePersSession != null) {
        const sessionId = maybePersSession.id

        const originQuery = await Origin.schema(originData.origin, storage).make(this.core)
        await originQuery.mutate(Mutators.data(originData))

        const tempSessionQuery = await TemporarySession.schema(sessionId).make(this.core)
        await tempSessionQuery.mutate(Mutators.data(maybePersSession))

        this.sessionByScript.set(script.name, sessionId)

        let scripts = this.scriptsBySession.get(sessionId)

        if (scripts == null) {
          scripts = new Set()
          this.scriptsBySession.set(sessionId, scripts)
        }

        scripts.add(script)

        script.events.on("close", async () => {
          scripts?.delete(script)
          this.sessionByScript.delete(script.name)
          return new None()
        })

        return new Ok(maybePersSession)
      }

      const originQuery = await Origin.schema(originData.origin, storage).make(this.core)
      await originQuery.mutate(Mutators.data(originData))

      const [persistent, walletId, chainId] = await this.tryRequest<[boolean, string, number]>({
        id: crypto.randomUUID(),
        origin: originData.origin,
        method: "eth_requestAccounts",
        params: {}
      }, mouse).then(r => r.throw(t).throw(t))

      const walletQuery = await Wallet.schema(walletId, storage).make(this.core)
      const wallet = Option.wrap(walletQuery.current?.inner).ok().throw(t)
      const chain = Option.wrap(chainByChainId[chainId]).ok().throw(t)

      const sessionData: ExSessionData = {
        id: crypto.randomUUID(),
        origin: originData.origin,
        wallets: [WalletRef.from(wallet)],
        chain: chain
      }

      const tempSessionQuery = await TemporarySession.schema(sessionData.id).make(this.core)
      await tempSessionQuery.mutate(Mutators.data<SessionData, never>(sessionData))

      if (persistent)
        await persSessionQuery.mutate(Mutators.data<SessionData, never>(sessionData))

      this.sessionByScript.set(script.name, sessionData.id)

      let scripts = this.scriptsBySession.get(sessionData.id)

      if (scripts == null) {
        scripts = new Set()
        this.scriptsBySession.set(sessionData.id, scripts)
      }

      scripts.add(script)

      script.events.on("close", async () => {
        scripts?.delete(script)
        this.sessionByScript.delete(script.name)
        return new None()
      })

      return new Ok(sessionData)
    })
  }

  async tryRouteContentScript(script: Port, request: RpcRequestPreinit<unknown>) {
    if (request.method === "brume_run")
      return new Some(await this.brume_run(script, request))
    return new None()
  }

  async brume_run(script: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [subrequest, mouse] = (request as RpcRequestPreinit<[RpcRequestPreinit<unknown>, Mouse]>).params

      const session = await this.tryGetOrWaitExtensionSession(script, mouse).then(r => r.throw(t))

      const { user, storage } = Option.wrap(this.#user).ok().throw(t)

      const { wallets, chain } = session

      const wallet = Option.wrap(wallets[0]).ok().throw(t)
      const brumes = await this.#getOrCreateEthBrumes(wallet)

      const ethereum: EthereumContext = { user, session, wallet, chain, brumes }

      if (subrequest.method === "eth_requestAccounts")
        return await this.eth_requestAccounts(ethereum, subrequest)
      if (subrequest.method === "eth_accounts")
        return await this.eth_accounts(ethereum, subrequest)
      if (subrequest.method === "eth_sendTransaction")
        return await this.eth_sendTransaction(ethereum, subrequest, mouse)
      if (subrequest.method === "personal_sign")
        return await this.personal_sign(ethereum, subrequest, mouse)
      if (subrequest.method === "eth_signTypedData_v4")
        return await this.eth_signTypedData_v4(ethereum, subrequest, mouse)
      if (subrequest.method === "wallet_switchEthereumChain")
        return await this.wallet_switchEthereumChain(ethereum, subrequest, mouse)

      const query = await getEthereumUnknown(ethereum, subrequest, storage).make(this.core)

      const result = await query.fetch().then(r => r.ignore())

      result.inspectSync(r => r.throw(t))

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, Error>(stored, { key: query.cacheKey })
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async eth_requestAccounts(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>): Promise<Result<string[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.wrap(this.#user).ok().throw(t)
      const session = Option.wrap(ethereum.session).ok().throw(t)

      const addresses = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<string, Error>>(async t => {
          const walletQuery = await Wallet.schema(wallet.uuid, storage).make(this.core)
          const walletData = Option.wrap(walletQuery.data?.inner).ok().throw(t)

          return new Ok(walletData.address)
        })
      }))).throw(t)

      return new Ok(addresses)
    })
  }

  async eth_accounts(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>): Promise<Result<string[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.wrap(this.#user).ok().throw(t)
      const session = Option.wrap(ethereum.session).ok().throw(t)

      const addresses = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<string, Error>>(async t => {
          const walletQuery = await Wallet.schema(wallet.uuid, storage).make(this.core)
          const walletData = Option.wrap(walletQuery.data?.inner).ok().throw(t)

          return new Ok(walletData.address)
        })
      }))).throw(t)

      return new Ok(addresses)
    })
  }

  async makeEthereumBalance(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage): Promise<Result<SimpleFetcherfulQueryInstance<EthereumQueryKey<unknown>, FixedInit, Error>, Error>> {
    return await Result.unthrow(async t => {
      const [address, block] = (request as RpcRequestPreinit<[string, string]>).params

      const query = await getBalance(ethereum, address, block, storage).make(this.core)

      return new Ok(query)
    })
  }

  async eth_getBalance(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [address, block] = (request as RpcRequestPreinit<[string, string]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const query = await getBalance(ethereum, address, block, storage).make(this.core)

      const result = await query.fetch().then(r => r.ignore())

      result.inspectSync(r => r.throw(t))

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, any>(stored, { key: query.cacheKey })
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async makeEthereumPairPrice(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage): Promise<Result<SimpleFetcherfulQueryInstance<EthereumQueryKey<unknown>, FixedInit, Error>, Error>> {
    return await Result.unthrow(async t => {
      const [address] = (request as RpcRequestPreinit<[string]>).params

      const pair = Option.wrap(pairByAddress[address]).ok().throw(t)
      const query = await getPairPrice(ethereum, pair, storage).make(this.core)

      return new Ok(query)
    })
  }

  async makeEthereumTokenBalance(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage): Promise<Result<SimpleFetcherfulQueryInstance<EthereumQueryKey<unknown>, FixedInit, Error>, Error>> {
    return await Result.unthrow(async t => {
      const [account, address, block] = (request as RpcRequestPreinit<[string, string, string]>).params

      const token = Option.wrap(tokenByAddress[address]).ok().throw(t)
      const query = await getTokenBalance(ethereum, account, token, block, storage).make(this.core)

      return new Ok(query)
    })
  }

  async eth_sendTransaction(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [{ from, to, gas, value, data }] = (request as RpcRequestPreinit<[{
        from: string,
        to: string,
        gas: string,
        value: Optional<string>,
        data: Optional<string>
      }]>).params

      const session = Option.wrap(ethereum.session).ok().throw(t)

      const signature = await this.tryRequest<string>({
        id: crypto.randomUUID(),
        method: "eth_sendTransaction",
        params: { from, to, gas, value, data },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.throw(t).throw(t))

      const signal = AbortSignal.timeout(600_000)

      return await tryEthereumFetch<string>(ethereum, {
        method: "eth_sendRawTransaction",
        params: [signature]
      }, { signal }).then(r => r.throw(t))
    })
  }

  async personal_sign(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, mouse?: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [message, address] = (request as RpcRequestPreinit<[string, string]>).params

      const session = Option.wrap(ethereum.session).ok().throw(t)

      const signature = await this.tryRequest<string>({
        id: crypto.randomUUID(),
        method: "personal_sign",
        params: { message, address },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.throw(t).throw(t))

      return new Ok(signature)
    })
  }

  async eth_signTypedData_v4(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [address, data] = (request as RpcRequestPreinit<[string, string]>).params

      const session = Option.wrap(ethereum.session).ok().throw(t)

      const signature = await this.tryRequest<string>({
        id: crypto.randomUUID(),
        method: "eth_signTypedData_v4",
        params: { data, address },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.throw(t).throw(t))

      return new Ok(signature)
    })
  }

  async wallet_switchEthereumChain(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [{ chainId }] = (request as RpcRequestPreinit<[{ chainId: string }]>).params

      const session = Option.wrap(ethereum.session).ok().throw(t)

      const chain = Option.wrap(chainByChainId[parseInt(chainId, 16)]).ok().throw(t)

      await this.tryRequest<void>({
        id: crypto.randomUUID(),
        method: "wallet_switchEthereumChain",
        params: { chainId },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.throw(t).throw(t))

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const updatedSession = { ...session, chain }

      const tempSessionQuery = await TemporarySession.schema(session.id).make(this.core)
      await tempSessionQuery.mutate(Mutators.replaceData(updatedSession))

      const persSessionQuery = await PersistentSession.schema(session.origin, storage).make(this.core)
      await persSessionQuery.mutate(Mutators.replaceData(updatedSession))

      for (const script of Option.wrap(this.scriptsBySession.get(session.id)).unwrapOr([]))
        await script.tryRequest({ method: "chainChanged", params: [chainId] }).then(r => r.ignore())

      return Ok.void()
    })
  }

  async tryRouteForeground(foreground: Port, request: RpcRequestInit<unknown>): Promise<Option<Result<unknown, Error>>> {
    if (request.method === "brume_getPath")
      return new Some(await this.brume_getPath(request))
    if (request.method === "brume_setPath")
      return new Some(await this.brume_setPath(request))
    if (request.method === "brume_login")
      return new Some(await this.brume_login(request))
    if (request.method === "brume_createUser")
      return new Some(await this.brume_createUser(foreground, request))
    // if (request.method === "brume_removeUser")
    //   return new Some(await this.brume_removeUser(foreground, request))
    if (request.method === "brume_createSeed")
      return new Some(await this.brume_createSeed(foreground, request))
    if (request.method === "brume_createWallet")
      return new Some(await this.brume_createWallet(foreground, request))
    // if (request.method === "brume_removeWallet")
    //   return new Some(await this.brume_removeWallet(foreground, request))
    if (request.method === "brume_disconnect")
      return new Some(await this.brume_disconnect(foreground, request))
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
    if (request.method === "brume_log")
      return new Some(await this.brume_log(request))
    if (request.method === "brume_open")
      return new Some(await this.brume_open(foreground, request))
    if (request.method === "brume_encrypt")
      return new Some(await this.brume_encrypt(foreground, request))
    if (request.method === "brume_decrypt")
      return new Some(await this.brume_decrypt(foreground, request))
    if (request.method === "brume_wc_connect")
      return new Some(await this.brume_wc_connect(foreground, request))
    if (request.method === "popup_hello")
      return new Some(await this.popup_hello(foreground, request))
    if (request.method === "brume_respond")
      return new Some(await this.brume_respond(foreground, request))
    return new None()
  }

  async brume_getPath(request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    return new Ok(this.#path)
  }

  async brume_setPath(request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [path] = (request as RpcRequestPreinit<[string]>).params

    this.#path = path

    return Ok.void()
  }

  async popup_hello(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      const returned = await this.events.emit("popup_hello", [foreground])

      if (returned.isSome() && returned.inner.isErr())
        return returned.inner

      return Ok.void()
    })
  }

  async brume_respond(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      const [response] = (request as RpcRequestPreinit<[RpcResponseInit<unknown>]>).params

      const returned = await this.events.emit("response", [response])

      if (returned.isSome() && returned.inner.isErr())
        return returned.inner

      return Ok.void()
    })
  }

  async brume_createUser(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<User[], Error>> {
    return await Result.unthrow(async t => {
      const [init] = (request as RpcRequestPreinit<[UserInit]>).params

      const user = await User.tryCreate(init).then(r => r.throw(t))

      const userQuery = await User.schema(init.uuid, this.storage).make(this.core)
      await userQuery.mutate(Mutators.data(user))

      const usersQuery = await Users.schema(this.storage).make(this.core)
      const usersData = Option.wrap(usersQuery.data?.inner).ok().throw(t)

      return new Ok(usersData)
    })
  }

  async brume_login(request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [uuid, password] = (request as RpcRequestPreinit<[string, string]>).params

      await this.trySetCurrentUser(uuid, password).then(r => r.throw(t))

      if (IS_EXTENSION)
        await this.trySetStoredPassword(uuid, password).then(r => r.throw(t))

      return Ok.void()
    })
  }

  async brume_getCurrentUser(request: RpcRequestPreinit<unknown>): Promise<Result<Optional<UserData>, Error>> {
    return await Result.unthrow(async t => {
      const userSession = this.#user

      if (userSession == null)
        return new Ok(undefined)

      const userQuery = await User.schema(userSession.user.uuid, this.storage).make(this.core)

      return new Ok(userQuery.current?.inner)
    })
  }

  async brume_disconnect(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [origin] = (request as RpcRequestPreinit<[string]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const persSessionQuery = await PersistentSession.schema(origin, storage).make(this.core)
      const persSessionData = Option.wrap(persSessionQuery.data?.inner).ok().throw(t)
      await persSessionQuery.delete()

      const tempSessionQuery = await TemporarySession.schema(persSessionData.id).make(this.core)
      await tempSessionQuery.delete()

      for (const script of Option.wrap(this.scriptsBySession.get(persSessionData.id)).unwrapOr([])) {
        await script.tryRequest({ method: "accountsChanged", params: [[]] }).then(r => r.ignore())
        this.sessionByScript.delete(script.name)
      }

      this.scriptsBySession.delete(persSessionData.id)

      return Ok.void()
    })
  }

  async brume_open(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [pathname] = (request as RpcRequestPreinit<[string]>).params

      await tryBrowser(async () => {
        return await browser.tabs.create({ url: `index.html#${pathname}` })
      }).then(r => r.throw(t))

      return Ok.void()
    })
  }

  async brume_encrypt(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<[string, string], Error>> {
    return await Result.unthrow(async t => {
      const [plainBase64] = (request as RpcRequestPreinit<[string]>).params

      const { crypter } = Option.wrap(this.#user).ok().throw(t)

      const plain = Base64.get().tryDecodePadded(plainBase64).throw(t).copyAndDispose()
      const iv = Bytes.tryRandom(16).throw(t)
      const cipher = await crypter.encrypt(plain, iv)

      const ivBase64 = Base64.get().tryEncodePadded(iv).throw(t)
      const cipherBase64 = Base64.get().tryEncodePadded(cipher).throw(t)

      return new Ok([ivBase64, cipherBase64])
    })
  }

  async brume_decrypt(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [ivBase64, cipherBase64] = (request as RpcRequestPreinit<[string, string]>).params

      const { crypter } = Option.wrap(this.#user).ok().throw(t)

      const iv = Base64.get().tryDecodePadded(ivBase64).throw(t).copyAndDispose()
      const cipher = Base64.get().tryDecodePadded(cipherBase64).throw(t).copyAndDispose()
      const plain = await crypter.decrypt(cipher, iv)

      const plainBase64 = Base64.get().tryEncodePadded(plain).throw(t)

      return new Ok(plainBase64)
    })
  }

  async brume_createSeed(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [seed] = (request as RpcRequestPreinit<[SeedData]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const seedQuery = await Seed.Background.schema(seed.uuid, storage).make(this.core)
      await seedQuery.mutate(Mutators.data(seed))

      return Ok.void()
    })
  }

  async brume_createWallet(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [wallet] = (request as RpcRequestPreinit<[WalletData]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const walletQuery = await Wallet.schema(wallet.uuid, storage).make(this.core)
      await walletQuery.mutate(Mutators.data(wallet))

      return Ok.void()
    })
  }

  async #getOrCreateEthBrumes(wallet: Wallet): Promise<EthBrumes> {
    const brumesQuery = await EthBrumes.schema(wallet).make(this.core)

    if (brumesQuery.current != null)
      return brumesQuery.current.inner

    const brumes = EthBrumes.createSubpool(this.ethereum, { capacity: 3 })
    await brumesQuery.mutate(Mutators.data(brumes))
    return brumes
  }

  async brume_get_global(request: RpcRequestPreinit<unknown>): Promise<Result<Optional<RawState>, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcRequestPreinit<[string]>).params

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
      const [cacheKey] = (request as RpcRequestPreinit<[string]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

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
      const [cacheKey] = (request as RpcRequestPreinit<[string]>).params

      const onState = async (event: CustomEvent<State<any, any>>) => {
        console.log("updated", cacheKey)
        const stored = await this.core.store(event.detail, { key: cacheKey })

        await foreground.tryRequest({
          method: "brume_update",
          params: [cacheKey, stored]
        }).then(r => r.ignore())
      }

      console.log("subscribe", cacheKey)
      this.core.onState.addListener(cacheKey, onState)

      foreground.events.on("close", () => {
        console.log("unsubscribe", cacheKey)
        this.core.onState.removeListener(cacheKey, onState)
        return new None()
      })

      return Ok.void()
    })
  }

  async makeEthereumUnknown(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
    return new Ok(await getEthereumUnknown(ethereum, request, storage).make(this.core))
  }

  async routeAndMakeEthereum(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage): Promise<Result<SimpleFetcherfulQueryInstance<any, FixedInit, Error>, Error>> {
    if (request.method === "eth_getBalance")
      return await this.makeEthereumBalance(ethereum, request, storage)
    if (request.method === "eth_getTokenBalance")
      return await this.makeEthereumTokenBalance(ethereum, request, storage)
    if (request.method === "eth_getPairPrice")
      return await this.makeEthereumPairPrice(ethereum, request, storage)
    return await this.makeEthereumUnknown(ethereum, request, storage)
  }

  async brume_eth_index(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [walletId, chainId, subrequest] = (request as RpcRequestPreinit<[string, number, RpcRequestPreinit<unknown>]>).params

      const { user, storage } = Option.wrap(this.#user).ok().throw(t)

      const walletQuery = await Wallet.schema(walletId, storage).make(this.core)
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)
      const chain = Option.wrap(chainByChainId[chainId]).ok().throw(t)

      const brumes = await this.#getOrCreateEthBrumes(wallet)

      const ethereum = { user, port: foreground, wallet, chain, brumes }

      const query = await this.routeAndMakeEthereum(ethereum, subrequest, storage).then(r => r.throw(t))

      await this.core.reindex(query.cacheKey, query.settings)

      return Ok.void()
    })
  }

  async brume_eth_fetch(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [walletId, chainId, subrequest] = (request as RpcRequestPreinit<[string, number, RpcRequestPreinit<unknown>]>).params

      const { user, storage } = Option.wrap(this.#user).ok().throw(t)

      const walletQuery = await Wallet.schema(walletId, storage).make(this.core)
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)
      const chain = Option.wrap(chainByChainId[chainId]).ok().throw(t)

      const brumes = await this.#getOrCreateEthBrumes(wallet)

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

  async brume_log(request: RpcRequestInit<unknown>): Promise<Result<void, Error>> {
    return await tryLoop(async (i) => {
      return await Result.unthrow<Result<void, Looped<Error>>>(async t => {
        const circuit = await Pool.takeCryptoRandom(this.circuits).then(r => r.mapErrSync(Retry.new).throw(t).result.get().inner)

        const body = JSON.stringify({ tor: true })
        await circuit.tryFetch("https://proxy.brume.money", { method: "POST", body }).then(r => r.inspectErrSync(() => console.warn(`Could not fetch logs`)).mapErrSync(Cancel.new).throw(t))
        await circuit.destroy()

        return Ok.void()
      })
    })
  }

  async brume_wc_connect(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<WcMetadata, Error>> {
    return await Result.unthrow(async t => {
      const [rawWcUrl, walletId] = (request as RpcRequestPreinit<[string, string]>).params

      const { user, storage } = Option.wrap(this.#user).ok().throw(t)

      const walletQuery = await Wallet.schema(walletId, storage).make(this.core)
      const wallet = Option.wrap(walletQuery.current?.inner).ok().throw(t)
      const chain = Option.wrap(chainByChainId[1]).ok().throw(t)

      const wcUrl = Url.tryParse(rawWcUrl).throw(t)
      const params = await Wc.tryParse(wcUrl).then(r => r.throw(t))

      const brume = await Pool.takeCryptoRandom(this.walletconnect).then(r => r.throw(t).result.get().inner)
      const socket = await brume.sockets.tryGet(0).then(r => r.throw(t).inner.socket)

      const irn = new IrnClient(socket)

      const session = await Wc.tryPair(irn, params, wallet.address).then(r => r.throw(t))

      const peerUrl = Url.tryParse(session.metadata.url).throw(t)

      /**
       * Avoid spoofed origin
       */
      peerUrl.protocol = "wc:"

      const originData: OriginData = {
        origin: peerUrl.origin,
        title: session.metadata.name,
        description: session.metadata.description
      }

      const originQuery = await Origin.schema(originData.origin, storage).make(this.core)
      await originQuery.mutate(Mutators.data(originData))

      const keyBase64 = Base64.get().tryEncodePadded(session.client.key).throw(t)

      const sessionData: WcSessionData = {
        type: "wc",
        id: crypto.randomUUID(),
        origin: originData.origin,
        wallets: [WalletRef.from(wallet)],
        chain: chain,
        relay: Wc.RELAY,
        topic: session.client.topic,
        keyBase64: keyBase64
      }

      const tempSessionQuery = await TemporarySession.schema(sessionData.id).make(this.core)
      await tempSessionQuery.mutate(Mutators.data<SessionData, never>(sessionData))

      const brumes = await this.#getOrCreateEthBrumes(wallet)

      session.client.events.on("request", async (suprequest) => {
        if (suprequest.method !== "wc_sessionRequest")
          return new None()
        const { chainId, request } = (suprequest as RpcRequestInit<WcSessionRequestParams>).params
        const chain = Option.wrap(chainByChainId[Number(chainId.split(":")[1])]).ok().throw(t)

        const ethereum: EthereumContext = { user, wallet, chain, brumes, session: sessionData }

        if (request.method === "personal_sign")
          return new Some(await this.personal_sign(ethereum, request))
        return new None()
      })

      return new Ok(session.metadata)
    })
  }

}

async function initBerith() {
  Ed25519.set(await Ed25519.fromSafeOrBerith())
  X25519.set(await X25519.fromSafeOrBerith())
}

async function initMorax() {
  Keccak256.set(await Keccak256.fromMorax())
  Sha1.set(await Sha1.fromMorax())
  Ripemd160.set(await Ripemd160.fromMorax())
}

async function initAlocer() {
  Base16.set(await Base16.fromBufferOrAlocer())
  Base64.set(await Base64.fromBufferOrAlocer())
  Base64Url.set(await Base64Url.fromBufferOrAlocer())
  Base58.set(await Base58.fromAlocer())
}

async function initZepar() {
  ChaCha20Poly1305.set(await ChaCha20Poly1305.fromZepar())
}

async function tryInit() {
  return await Result.runAndDoubleWrap(async () => {
    return await Result.unthrow<Result<Global, Error>>(async t => {
      await Promise.all([initBerith(), initMorax(), initAlocer(), initZepar()])

      const ed25519 = Ed25519.get()
      const x25519 = X25519.get()
      const sha1 = Sha1.get()

      const fallbacks = await tryFetch<Fallback[]>(FALLBACKS_URL).then(r => r.throw(t))

      const tors = createTorPool(async () => {
        return await tryCreateTor({ fallbacks, ed25519, x25519, sha1 })
      }, { capacity: 9 })

      const storage = IDBStorage.tryCreate({ name: "memory" }).unwrap()
      const global = new Global(tors, storage)

      await global.tryInit().then(r => r.throw(t))

      return new Ok(global)
    })
  }).then(r => r.flatten())
}

const init = tryInit()

if (IS_WEBSITE) {

  const onSkipWaiting = (event: ExtendableMessageEvent) =>
    self.skipWaiting()

  const onHelloWorld = async (event: ExtendableMessageEvent) => {
    const raw = event.ports[0]

    const port = new WebsitePort("foreground", raw)

    const onRequest = async (request: RpcRequestInit<unknown>) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      return await inited.get().tryRouteForeground(port, request)
    }

    port.events.on("request", onRequest, { passive: true })

    const onClose = () => {
      port.events.off("request", onRequest)
      port.clean()
      port.port.close()
      return new None()
    }

    port.events.on("close", onClose, { passive: true })

    raw.start()

    await port.tryRequest({ method: "brume_hello" }).then(r => r.ignore())

    port.runPingLoop()
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
    const script = new ExtensionPort(crypto.randomUUID(), port)

    script.events.on("request", async (request) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      return await inited.get().tryRouteContentScript(script, request)
    })
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