import "@hazae41/symbol-dispose-polyfill"
import "@hazae41/worker-online-polyfill"

import { Blobs } from "@/libs/blobs/blobs"
import { BrowserError, browser } from "@/libs/browser/browser"
import { ExtensionRpcRouter, MessageRpcRouter, RpcRouter } from "@/libs/channel/channel"
import { Console } from "@/libs/console"
import { chainDataByChainId } from "@/libs/ethereum/mods/chain"
import { fetchAsBlobOrThrow } from "@/libs/fetch/fetch"
import { Mutators } from "@/libs/glacier/mutators"
import { Mime } from "@/libs/mime/mime"
import { Mouse } from "@/libs/mouse/mouse"
import { isAndroidApp, isAppleApp, isChromeExtension, isExtension, isFirefoxExtension, isIpad, isSafariExtension, isWebsite } from "@/libs/platform/platform"
import { AbortSignals } from "@/libs/signals/signals"
import { Strings } from "@/libs/strings/strings"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { createNativeWebSocketPool, createTorPool } from "@/libs/tor/tors/tors"
import { qurl } from "@/libs/url/url"
import { randomUUID } from "@/libs/uuid/uuid"
import { CryptoClient } from "@/libs/wconn/mods/crypto/client"
import { IrnBrume } from "@/libs/wconn/mods/irn/irn"
import { Wc, WcMetadata, WcSession, WcSessionRequestParams } from "@/libs/wconn/mods/wc/wc"
import { UnauthorizedError } from "@/mods/foreground/errors/errors"
import { Paths } from "@/mods/foreground/router/path/context"
import { Base16 } from "@hazae41/base16"
import { Base58 } from "@hazae41/base58"
import { Base64 } from "@hazae41/base64"
import { Base64Url } from "@hazae41/base64url"
import { Bytes } from "@hazae41/bytes"
import { Cadenas } from "@hazae41/cadenas"
import { ChaCha20Poly1305 } from "@hazae41/chacha20poly1305"
import { ZeroHexAsInteger, ZeroHexString } from "@hazae41/cubane"
import { Circuit, Echalote } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Fleche, fetch } from "@hazae41/fleche"
import { Future } from "@hazae41/future"
import { Data, IDBStorage, RawState, SimpleQuery, State, core } from "@hazae41/glacier"
import { RpcError, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { Kcp } from "@hazae41/kcp"
import { Keccak256 } from "@hazae41/keccak256"
import { Mutex } from "@hazae41/mutex"
import { None, Nullable, Option, Some } from "@hazae41/option"
import { Pool } from "@hazae41/piscine"
import { SuperEventTarget } from "@hazae41/plume"
import { Err, Ok, Result } from "@hazae41/result"
import { Ripemd160 } from "@hazae41/ripemd160"
import { Secp256k1 } from "@hazae41/secp256k1"
import { Sha1 } from "@hazae41/sha1"
import { Smux } from "@hazae41/smux"
import { X25519 } from "@hazae41/x25519"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { BgEthereumContext } from "./context"
import { BgBlobby, BlobbyRef } from "./entities/blobbys/data"
import { EthBrume, WcBrume } from "./entities/brumes/data"
import { BgEns } from "./entities/names/data"
import { BgOrigin, OriginData, PreOriginData } from "./entities/origins/data"
import { AppRequest, AppRequestData, BgAppRequest } from "./entities/requests/data"
import { BgSeed, SeedData } from "./entities/seeds/data"
import { BgSession, ExSessionData, SessionData, SessionRef, SessionStorage, WcSessionData } from "./entities/sessions/data"
import { Status, StatusData } from "./entities/sessions/status/data"
import { BgSettings } from "./entities/settings/data"
import { BgSimulation } from "./entities/simulations/data"
import { BgToken } from "./entities/tokens/data"
import { BgUser, User, UserData, UserInit, UserSession } from "./entities/users/data"
import { BgWallet, EthereumFetchParams, EthereumQueryKey, Wallet, WalletData, WalletRef } from "./entities/wallets/data"
import { createUserStorageOrThrow } from "./storage"

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_PRODUCTION?: boolean,
  }
}

declare const self: ServiceWorkerGlobalScope

if (isWebsite() && self.__WB_PRODUCTION) {
  clientsClaim()

  precacheAndRoute(self.__WB_MANIFEST)

  /**
   * TODO remove?
   */
  self.addEventListener("message", (event) => {
    if (event.origin !== location.origin)
      return
    if (event.data !== "SKIP_WAITING")
      return
    self.skipWaiting()
  })
}

if (isWebsite() && !self.__WB_PRODUCTION) {
  clientsClaim()
  self.skipWaiting()
}

if (isAndroidApp()) {
  clientsClaim()
  self.skipWaiting()
}

interface PasswordData {
  uuid?: string
  password?: string
}

interface PopupData {
  tab: chrome.tabs.Tab,
  port: RpcRouter
}

interface Slot<T> {
  current?: T
}

interface PermissionRequest {
  readonly [methodName: string]: {
    readonly [caveatName: string]: any;
  }
}

interface RequestedPermission {
  readonly parentCapability: string;
  readonly date?: number;
}

interface Caveat {
  readonly type: string;
  readonly value: any;
}

interface Permission {
  readonly invoker: string;
  readonly parentCapability: string;
  readonly caveats: Caveat[];
}

class Global {

  readonly events = new SuperEventTarget<{
    "popup_hello": (foreground: RpcRouter) => Result<void, Error>
    "response": (response: RpcResponseInit<unknown>) => Result<void, Error>
  }>()

  #user?: UserSession
  #path: string = "/"

  readonly resolveOnUser = new Future<UserSession>()

  readonly circuits: Mutex<Pool<Circuit>>

  #wcs?: Mutex<Pool<WcBrume>>
  #eths?: Mutex<Pool<EthBrume>>

  readonly brumeByUuid = new Mutex(new Map<string, EthBrume>())

  readonly scriptsBySession = new Map<string, Set<RpcRouter>>()

  readonly sessionByScript = new Map<string, Mutex<Slot<string>>>()

  readonly wcBySession = new Map<string, WcSession>()

  /**
   * Current popup
   */
  readonly popup = new Mutex<Slot<PopupData>>({})

  constructor(
    readonly storage: IDBStorage
  ) {
    const sockets = new Mutex(createNativeWebSocketPool({ capacity: 1 }).get())
    const tors = new Mutex(createTorPool(sockets, { capacity: 1 }).get())
    const circuits = new Mutex(Circuits.pool(tors.inner, { capacity: 8 }))

    this.circuits = circuits

    core.onState.on(BgAppRequest.All.key, async () => {
      const state = core.getStateSync(BgAppRequest.All.key) as State<AppRequest[], never>

      const badge = Option
        .wrap(state?.data?.get()?.length)
        .filterSync(x => x > 0)
        .mapSync(String)
        .unwrapOr("")

      await Result.runAndWrap(async () => {
        await browser.action.setBadgeBackgroundColor({ color: "#ba77ff" })
        await browser.action.setBadgeTextColor({ color: "white" })
        await browser.action.setBadgeText({ text: badge })
      }).then(r => r.ignore())

      return new None()
    })
  }

  async getStoredPasswordOrThrow(): Promise<Nullable<PasswordData>> {
    if (!isExtension())
      return
    return await BrowserError.runOrThrow(() => browser.storage.session.get(["uuid", "password"]))
  }

  async setStoredPasswordOrThrow(uuid: string, password: string) {
    if (!isExtension())
      return
    await BrowserError.runOrThrow(() => browser.storage.session.set({ uuid, password }))
  }

  async initOrThrow(): Promise<void> {
    const credentials = await this.getStoredPasswordOrThrow()

    if (credentials == null)
      return

    const { uuid, password } = credentials
    await this.setCurrentUserOrThrow(uuid, password)
  }

  async setCurrentUserOrThrow(uuid: Nullable<string>, password: Nullable<string>): Promise<Nullable<UserSession>> {
    if (uuid == null)
      return undefined
    if (password == null)
      return undefined

    if (this.#user != null)
      return this.#user

    const userQuery = BgUser.schema(uuid, this.storage)
    const userState = await userQuery.state
    const userData = Option.unwrap(userState.current?.get())

    const user: User = { ref: true, uuid: userData.uuid }

    const { storage, hasher, crypter } = await createUserStorageOrThrow(userData, password)

    const currentUserQuery = BgUser.Current.schema(storage)
    await currentUserQuery.mutate(() => new Some(new Data(user)))

    const userSession: UserSession = { user, storage, hasher, crypter }

    this.#user = userSession

    this.resolveOnUser.resolve(userSession)
    await this.#wcReconnectAllOrThrow()

    this.#wcs = new Mutex(WcBrume.createPool(this.circuits, { capacity: 1 }))
    this.#eths = new Mutex(EthBrume.createPool(this.circuits, chainDataByChainId, { capacity: 1 }))

    return userSession
  }

  async waitPopupHelloOrThrow(tab: chrome.tabs.Tab) {
    const future = new Future<RpcRouter>()

    const onRequest = (foreground: RpcRouter) => {
      future.resolve(foreground)
      return new Some(Ok.void())
    }

    const onRemoved = (id: number) => {
      if (id !== tab.id)
        return
      future.reject(new Error())
    }

    try {
      this.events.on("popup_hello", onRequest, { passive: true })
      browser.tabs.onRemoved.addListener(onRemoved)

      return await future.promise
    } finally {
      this.events.off("popup_hello", onRequest)
      browser.tabs.onRemoved.removeListener(onRemoved)
    }
  }

  async openOrFocusPopupOrThrow(pathname: string, mouse: Mouse, force?: boolean): Promise<PopupData> {
    return await this.popup.lock(async (slot) => {
      if (slot.current != null) {
        const tabId = Option.unwrap(slot.current.tab.id)
        const windowId = Option.unwrap(slot.current.tab.windowId)

        const url = force ? `popup.html#${pathname}` : undefined

        await BrowserError.tryRun(() => browser.tabs.update(tabId, { url, highlighted: true })).then(r => r.ignore())
        await BrowserError.tryRun(() => browser.windows.update(windowId, { focused: true })).then(r => r.ignore())

        return slot.current
      }

      const height = 630
      const width = 400

      const top = Math.max(mouse.y - (height / 2), 0)
      const left = Math.max(mouse.x - (width / 2), 0)

      const tab = "create" in browser.windows
        ? await BrowserError.runOrThrow(() => browser.windows.create({ type: "popup", url: `popup.html?_=${encodeURIComponent(pathname)}`, state: "normal", height, width, top, left }).then(w => w.tabs?.[0]))
        : await BrowserError.runOrThrow(() => browser.tabs.create({ url: `popup.html?_=${encodeURIComponent(pathname)}`, active: true }))

      if (tab == null)
        throw new Error("Failed to create tab")

      const channel = await this.waitPopupHelloOrThrow(tab)

      slot.current = { tab, port: channel }

      const onRemoved = (tabId: number) => {
        if (tabId !== tab.id)
          return

        slot.current = undefined

        browser.tabs.onRemoved.removeListener(onRemoved)
      }

      browser.tabs.onRemoved.addListener(onRemoved)

      return slot.current
    })
  }

  async requestOrThrow<T>(request: AppRequestData, mouse?: Mouse): Promise<RpcResponse<T>> {
    if (mouse != null)
      return await this.requestPopupOrThrow(request, mouse)

    return await this.requestNoPopupOrThrow(request)
  }

  async requestNoPopupOrThrow<T>(request: AppRequestData): Promise<RpcResponse<T>> {
    const requestQuery = BgAppRequest.schema(request.id)
    await requestQuery.mutate(Mutators.data<AppRequestData, never>(request))

    const done = new Future<Result<void, Error>>()

    try {
      return await this.waitResponseOrThrow(request.id, done)
    } finally {
      await requestQuery.delete()
      done.resolve(Ok.void())
    }
  }

  async requestPopupOrThrow<T>(request: AppRequestData, mouse: Mouse): Promise<RpcResponse<T>> {
    const requestQuery = BgAppRequest.schema(request.id)
    await requestQuery.mutate(Mutators.data<AppRequestData, never>(request))

    const done = new Future<Result<void, Error>>()

    try {
      const { id, method, params } = request
      const url = qurl(`/${method}?id=${id}`, params)

      if (isSafariExtension() && isIpad()) {
        this.#path = `#${Paths.path(url)}`

        await BrowserError.runOrThrow(() => (browser.browserAction as any).openPopup())
        const response = await this.waitResponseOrThrow<T>(request.id, done)

        return response
      }

      const popup = await this.openOrFocusPopupOrThrow(url.href, mouse)
      const response = await this.waitPopupResponseOrThrow<T>(request.id, popup, done)

      return response
    } finally {
      await requestQuery.delete()
      done.resolve(Ok.void())
    }
  }

  async getOrWaitUserOrThrow(mouse: Mouse) {
    if (this.#user != null)
      return this.#user

    if (isSafariExtension() && isIpad()) {
      await BrowserError.runOrThrow(() => (browser.browserAction as any).openPopup())
      return await this.resolveOnUser.promise
    } else {
      const popup = await this.openOrFocusPopupOrThrow("", mouse)
      return await this.waitUserOrPopupRemovalOrThrow(popup)
    }
  }

  async waitUserOrPopupRemovalOrThrow(popup: PopupData) {
    const rejectOnRemove = new Future<never>()

    const onRemoved = (id: number) => {
      if (id !== popup.tab.id)
        return
      rejectOnRemove.reject(new Error())
    }

    try {
      browser.tabs.onRemoved.addListener(onRemoved)

      return await Promise.race([this.resolveOnUser.promise, rejectOnRemove.promise])
    } finally {
      browser.tabs.onRemoved.removeListener(onRemoved)
    }
  }

  async waitResponseOrThrow<T>(id: string, done: Future<Result<void, Error>>) {
    const future = new Future<RpcResponse<T>>()

    const onResponse = async (init: RpcResponseInit<any>) => {
      if (init.id !== id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(response)

      return new Some(await done.promise)
    }

    try {
      this.events.on("response", onResponse, { passive: true })

      return await future.promise
    } finally {
      this.events.off("response", onResponse)
    }
  }

  async waitPopupResponseOrThrow<T>(id: string, popup: PopupData, done: Future<Result<void, Error>>) {
    const future = new Future<RpcResponse<T>>()

    const onResponse = async (init: RpcResponseInit<any>) => {
      if (init.id !== id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(response)

      return new Some(await done.promise)
    }

    const onRemoved = (id: number) => {
      if (id !== popup.tab.id)
        return
      future.reject(new Error())
    }

    try {
      this.events.on("response", onResponse, { passive: true })
      browser.tabs.onRemoved.addListener(onRemoved)

      return await future.promise
    } finally {
      this.events.off("response", onResponse)
      browser.tabs.onRemoved.removeListener(onRemoved)
    }
  }

  async getExtensionSessionOrThrow(script: RpcRouter, mouse: Mouse, force: boolean): Promise<Nullable<ExSessionData>> {
    let mutex = this.sessionByScript.get(script.name)

    if (mutex == null) {
      mutex = new Mutex<Slot<string>>({})
      this.sessionByScript.set(script.name, mutex)
    }

    return await mutex.lock(async slot => {
      const currentSession = slot.current

      if (currentSession != null) {
        const { storage } = Option.unwrap(this.#user)

        const sessionQuery = BgSession.schema(currentSession, storage)
        const sessionState = await sessionQuery.state
        const sessionData = Option.unwrap(sessionState.data?.get())

        if (sessionData.type === "wc")
          throw new Error("Unexpected WalletConnect session")

        return sessionData
      }

      const { storage } = Option.unwrap(this.#user)

      const preOriginData = await script.requestOrThrow<PreOriginData>({
        method: "brume_origin"
      }).then(r => r.unwrap())

      const { origin, title, description } = preOriginData
      const iconQuery = BgBlobby.schema(origin, storage)
      const iconRef = BlobbyRef.create(origin)

      if (preOriginData.icon) {
        const iconData = { id: origin, data: preOriginData.icon }
        await iconQuery.mutate(Mutators.data(iconData))
      }

      const originQuery = BgOrigin.schema(origin, storage)
      const originData: OriginData = { origin, title, description, icons: [iconRef] }
      await originQuery.mutate(Mutators.data(originData))

      const sessionByOriginQuery = BgSession.ByOrigin.schema(origin, storage)
      const sessionByOriginState = await sessionByOriginQuery.state

      if (sessionByOriginState.data != null) {
        const sessionId = sessionByOriginState.data.get().id

        const sessionQuery = BgSession.schema(sessionId, storage)
        const sessionState = await sessionQuery.state
        const sessionData = Option.unwrap(sessionState.data?.get())

        if (sessionData.type === "wc")
          throw new Error("Unexpected WalletConnect session")

        slot.current = sessionId

        let scripts = this.scriptsBySession.get(sessionId)

        if (scripts == null) {
          scripts = new Set()
          this.scriptsBySession.set(sessionId, scripts)
        }

        scripts.add(script)

        const { id } = sessionData
        await Status.schema(id).mutate(Mutators.data<StatusData, never>({ id }))

        script.events.on("close", async () => {
          scripts!.delete(script)
          this.sessionByScript.delete(script.name)

          if (scripts!.size === 0) {
            const { id } = sessionData
            await Status.schema(id).delete()
          }

          return new None()
        })

        const userChainState = await BgSettings.Chain.schema(storage).state
        const userChainId = Option.wrap(userChainState.data?.get()).unwrapOr(1)
        const userChainData = Option.unwrap(chainDataByChainId[userChainId])

        const { chainId } = sessionData.chain

        if (userChainData.chainId !== chainId) {
          await script.requestOrThrow<void>({
            method: "chainChanged",
            params: [ZeroHexAsInteger.fromOrThrow(chainId)]
          }).then(r => r.unwrap())

          await script.requestOrThrow({
            method: "networkChanged",
            params: [chainId.toString()]
          }).then(r => r.unwrap())
        }

        return sessionData
      }

      if (!force)
        return undefined

      const userChainState = await BgSettings.Chain.schema(storage).state
      const userChainId = Option.wrap(userChainState.data?.get()).unwrapOr(1)
      const userChainData = Option.unwrap(chainDataByChainId[userChainId])

      const [persistent, wallets] = await this.requestPopupOrThrow<[boolean, Wallet[]]>({
        id: randomUUID(),
        origin: origin,
        method: "eth_requestAccounts",
        params: {}
      }, mouse).then(r => r.unwrap())

      const sessionData: ExSessionData = {
        type: "ex",
        id: randomUUID(),
        origin: origin,
        persist: persistent,
        wallets: wallets.map(wallet => WalletRef.from(wallet)),
        chain: userChainData
      }

      const sessionQuery = BgSession.schema(sessionData.id, storage)
      await sessionQuery.mutate(Mutators.data<SessionData, never>(sessionData))

      slot.current = sessionData.id

      let scripts = this.scriptsBySession.get(sessionData.id)

      if (scripts == null) {
        scripts = new Set()
        this.scriptsBySession.set(sessionData.id, scripts)
      }

      scripts.add(script)

      const { id } = sessionData
      await Status.schema(id).mutate(Mutators.data<StatusData, never>({ id }))

      script.events.on("close", async () => {
        scripts!.delete(script)
        this.sessionByScript.delete(script.name)

        if (scripts!.size === 0) {
          const { id } = sessionData
          await Status.schema(id).delete().catch(console.warn)
        }

        return new None()
      })

      return sessionData
    })
  }

  async tryRouteContentScript(script: RpcRouter, request: RpcRequestPreinit<unknown>) {
    if (request.method === "brume_icon")
      return new Some(new Ok(await this.brume_icon(script, request)))
    if (request.method === "brume_run")
      return new Some(await this.brume_run(script, request))
    return new None()
  }

  async brume_icon(script: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<string> {
    return await Blobs.readAsDataUrlOrThrow(await fetchAsBlobOrThrow("/favicon.png"))
  }

  async brume_run(script: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    const [subrequest, mouse] = (request as RpcRequestPreinit<[RpcRequestPreinit<unknown>, Mouse]>).params

    const { storage } = await this.getOrWaitUserOrThrow(mouse)

    const userChainState = await BgSettings.Chain.schema(storage).state
    const userChainId = Option.wrap(userChainState.data?.get()).unwrapOr(1)
    const userChainData = Option.unwrap(chainDataByChainId[userChainId])

    let session = await this.getExtensionSessionOrThrow(script, mouse, false)

    if (subrequest.method === "eth_accounts" && session == null)
      return new Ok([])
    if (subrequest.method === "eth_chainId" && session == null)
      return new Ok(ZeroHexAsInteger.fromOrThrow(userChainData.chainId))
    if (subrequest.method === "eth_coinbase" && session == null)
      return new Ok(undefined)
    if (subrequest.method === "net_version" && session == null)
      return new Ok(userChainData.chainId.toString())

    session = await this.getExtensionSessionOrThrow(script, mouse, true)

    if (session == null)
      return new Err(new UnauthorizedError())

    const { wallets } = session

    const sessionChainData = session.chain

    const firstWalletRef = Option.unwrap(wallets[0])
    const brume = await this.#getOrTakeEthBrumeOrThrow(firstWalletRef.uuid)

    const context: BgEthereumContext = { chain: sessionChainData, brume }

    if (subrequest.method === "eth_requestAccounts")
      return await this.eth_requestAccounts(context, session, subrequest)
    if (subrequest.method === "eth_accounts")
      return await this.eth_accounts(context, session, subrequest)
    if (subrequest.method === "eth_coinbase")
      return await this.eth_coinbase(context, session, subrequest)
    if (subrequest.method === "eth_chainId")
      return await this.eth_chainId(context, session, subrequest)
    if (subrequest.method === "net_version")
      return await this.net_version(context, session, subrequest)
    if (subrequest.method === "wallet_requestPermissions")
      return await this.wallet_requestPermissions(context, session, subrequest)
    if (subrequest.method === "wallet_getPermissions")
      return await this.wallet_getPermissions(context, session, subrequest)
    if (subrequest.method === "eth_sendTransaction")
      return await this.eth_sendTransaction(context, session, subrequest, mouse)
    if (subrequest.method === "personal_sign")
      return await this.personal_sign(context, session, subrequest, mouse)
    if (subrequest.method === "eth_signTypedData_v4")
      return await this.eth_signTypedData_v4(context, session, subrequest, mouse)
    if (subrequest.method === "wallet_switchEthereumChain")
      return await this.wallet_switchEthereumChain(context, session, subrequest, mouse)

    return await BgEthereumContext.fetchOrFail(context, { ...subrequest, noCheck: true })
  }

  async eth_requestAccounts(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string[], Error>> {
    const { storage } = Option.unwrap(this.#user)

    const addresses = await Promise.all(session.wallets.map(async wallet => {
      const walletQuery = BgWallet.schema(wallet.uuid, storage)
      const walletState = await walletQuery.state
      const walletData = Option.unwrap(walletState.data?.get())

      return walletData.address
    }))

    return new Ok(addresses)
  }

  async eth_accounts(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string[], Error>> {
    const { storage } = Option.unwrap(this.#user)

    const addresses = await Promise.all(session.wallets.map(async wallet => {
      const walletQuery = BgWallet.schema(wallet.uuid, storage)
      const walletState = await walletQuery.state
      const walletData = Option.unwrap(walletState.data?.get())

      return walletData.address
    }))

    return new Ok(addresses)
  }

  async eth_coinbase(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<string>, Error>> {
    const { storage } = Option.unwrap(this.#user)

    const walletRef = session.wallets.at(0)

    if (walletRef == null)
      return new Ok(undefined)

    const walletQuery = BgWallet.schema(walletRef.uuid, storage)
    const walletState = await walletQuery.state
    const walletData = Option.unwrap(walletState.data?.get())

    return new Ok(walletData.address)
  }

  async eth_chainId(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    if (session.type === "wc")
      throw new Error("Unexpected WalletConnect session")

    return new Ok(ZeroHexAsInteger.fromOrThrow(session.chain.chainId))
  }

  async net_version(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    if (session.type === "wc")
      throw new Error("Unexpected WalletConnect session")

    return new Ok(session.chain.chainId.toString())
  }

  async wallet_requestPermissions(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<RequestedPermission[], Error>> {
    const [prequest] = (request as RpcRequestPreinit<[PermissionRequest]>).params
    return new Ok(Object.keys(prequest).map(it => ({ parentCapability: it })))
  }

  async wallet_getPermissions(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<Permission[], Error>> {
    return new Ok([{ invoker: session.origin, parentCapability: "eth_accounts", caveats: [] }])
  }

  async eth_getBalance(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    const [address, block] = (request as RpcRequestPreinit<[ZeroHexString, string]>).params

    const { storage } = Option.unwrap(this.#user)

    const query = BgToken.Native.Balance.schema(address, block, ethereum, storage)

    try { await query.fetch() } catch { }

    const stored = core.storeds.get(query.cacheKey)
    const unstored = await core.unstoreOrThrow<any, unknown, any>(stored, { key: query.cacheKey })
    const fetched = Option.unwrap(unstored.current)

    return fetched
  }

  async eth_sendTransaction(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse?: Mouse): Promise<Result<string, Error>> {
    const [{ from, to, gas, value, nonce, data, gasPrice, maxFeePerGas, maxPriorityFeePerGas }] = (request as RpcRequestPreinit<[{
      from: string,
      to: Nullable<string>,
      gas: Nullable<string>,
      value: Nullable<string>,
      nonce: Nullable<string>,
      data: Nullable<string>,
      gasPrice: Nullable<string>,
      maxFeePerGas: Nullable<string>,
      maxPriorityFeePerGas: Nullable<string>,
    }]>).params

    const { storage } = Option.unwrap(this.#user)

    const wallets = await Promise.all(session.wallets.map(async wallet => {
      const walletQuery = BgWallet.schema(wallet.uuid, storage)
      const walletState = await walletQuery.state
      return Option.unwrap(walletState.data?.get())
    }))

    /**
     * TODO: maybe ensure two wallets can't have the same address in the same session
     */
    const maybeWallet = wallets.find(wallet => Strings.equalsIgnoreCase(wallet.address, from))
    const walletId = Option.unwrap(maybeWallet?.uuid)

    const chainId = ZeroHexAsInteger.fromOrThrow(ethereum.chain.chainId)

    const hash = await this.requestOrThrow<string>({
      id: randomUUID(),
      method: "eth_sendTransaction",
      params: { walletId, chainId, from, to, gas, value, nonce, data, gasPrice, maxFeePerGas, maxPriorityFeePerGas },
      origin: session.origin,
      session: session.id
    }, mouse).then(r => r.unwrap())

    return new Ok(hash)
  }

  async personal_sign(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse?: Mouse): Promise<Result<string, Error>> {
    const [message, address] = (request as RpcRequestPreinit<[string, string]>).params

    const { storage } = Option.unwrap(this.#user)

    const wallets = await Promise.all(session.wallets.map(async wallet => {
      const walletQuery = BgWallet.schema(wallet.uuid, storage)
      const walletState = await walletQuery.state
      return Option.unwrap(walletState.data?.get())
    }))

    /**
     * TODO: maybe ensure two wallets can't have the same address in the same session
     */
    const maybeWallet = wallets.find(wallet => Strings.equalsIgnoreCase(wallet.address, address))
    const walletId = Option.unwrap(maybeWallet?.uuid)

    const chainId = ZeroHexAsInteger.fromOrThrow(ethereum.chain.chainId)

    const signature = await this.requestOrThrow<string>({
      id: randomUUID(),
      method: "personal_sign",
      params: { message, address, walletId, chainId },
      origin: session.origin,
      session: session.id
    }, mouse).then(r => r.unwrap())

    return new Ok(signature)
  }

  async eth_signTypedData_v4(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse?: Mouse): Promise<Result<string, Error>> {
    const [address, data] = (request as RpcRequestPreinit<[string, string]>).params

    const { storage } = Option.unwrap(this.#user)

    const wallets = await Promise.all(session.wallets.map(async wallet => {
      const walletQuery = BgWallet.schema(wallet.uuid, storage)
      const walletState = await walletQuery.state
      return Option.unwrap(walletState.data?.get())
    }))

    /**
     * TODO: maybe ensure two wallets can't have the same address in the same session
     */
    const maybeWallet = wallets.find(wallet => Strings.equalsIgnoreCase(wallet.address, address))
    const walletId = Option.unwrap(maybeWallet?.uuid)

    const chainId = ZeroHexAsInteger.fromOrThrow(ethereum.chain.chainId)

    const signature = await this.requestOrThrow<string>({
      id: randomUUID(),
      method: "eth_signTypedData_v4",
      params: { data, address, walletId, chainId },
      origin: session.origin,
      session: session.id
    }, mouse).then(r => r.unwrap())

    return new Ok(signature)
  }

  async wallet_switchEthereumChain(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<void, Error>> {
    const [{ chainId }] = (request as RpcRequestPreinit<[{ chainId: string }]>).params

    const { storage } = Option.unwrap(this.#user)

    const chain = Option.unwrap(chainDataByChainId[Number(chainId)])

    const sessionQuery = BgSession.schema(session.id, storage)
    const sessionState = await sessionQuery.state
    const sessionData = Option.unwrap(sessionState.data?.get())

    if (sessionData.type === "wc")
      throw new Error("Unexpected WalletConnect session")

    await sessionQuery.mutate(() => new Some(new Data({ ...sessionData, chain })))

    for (const script of Option.wrap(this.scriptsBySession.get(session.id)).unwrapOr([])) {
      await script.requestOrThrow({
        method: "chainChanged",
        params: [ZeroHexAsInteger.fromOrThrow(chain.chainId)]
      }).then(r => r.unwrap())

      await script.requestOrThrow({
        method: "networkChanged",
        params: [chain.chainId.toString()]
      }).then(r => r.unwrap())
    }

    return Ok.void()
  }

  async routeForegroundOrThrow(foreground: RpcRouter, request: RpcRequestInit<unknown>): Promise<Option<Result<unknown, Error>>> {
    if (request.method === "brume_getPath")
      return new Some(await this.brume_getPath(request))
    if (request.method === "brume_setPath")
      return new Some(await this.brume_setPath(request))
    if (request.method === "brume_login")
      return new Some(await this.brume_login(request))
    if (request.method === "brume_createUser")
      return new Some(await this.brume_createUser(foreground, request))
    if (request.method === "brume_createSeed")
      return new Some(await this.brume_createSeed(foreground, request))
    if (request.method === "brume_createWallet")
      return new Some(await this.brume_createWallet(foreground, request))
    if (request.method === "brume_switchEthereumChain")
      return new Some(await this.brume_switchEthereumChain(foreground, request))
    if (request.method === "brume_disconnect")
      return new Some(await this.brume_disconnect(foreground, request))
    if (request.method === "brume_get_global")
      return new Some(await this.brume_get_global(foreground, request))
    if (request.method === "brume_get_user")
      return new Some(await this.brume_get_user(foreground, request))
    if (request.method === "brume_set_user")
      return new Some(await this.brume_set_user(request))
    if (request.method === "brume_eth_fetch")
      return new Some(await this.brume_eth_fetch(foreground, request))
    if (request.method === "brume_eth_custom_fetch")
      return new Some(await this.brume_eth_custom_fetch(foreground, request))
    if (request.method === "brume_log")
      return new Some(await this.brume_log(request))
    if (request.method === "brume_encrypt")
      return new Some(await this.brume_encrypt(foreground, request))
    if (request.method === "brume_decrypt")
      return new Some(await this.brume_decrypt(foreground, request))
    if (request.method === "brume_wc_connect")
      return new Some(await this.brume_wc_connect(foreground, request))
    if (request.method === "brume_wc_status")
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

  async popup_hello(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const returned = await this.events.emit("popup_hello", foreground)

    if (returned.isSome() && returned.inner.isErr())
      return returned.inner

    return Ok.void()
  }

  async brume_respond(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [response] = (request as RpcRequestPreinit<[RpcResponseInit<unknown>]>).params

    const returned = await this.events.emit("response", response)

    if (returned.isSome() && returned.inner.isErr())
      return returned.inner

    return Ok.void()
  }

  async brume_createUser(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [init] = (request as RpcRequestPreinit<[UserInit]>).params

    const userData = await BgUser.createOrThrow(init)
    const userQuery = BgUser.schema(init.uuid, this.storage)
    await userQuery.mutate(() => new Some(new Data(userData)))

    return Ok.void()
  }

  async brume_login(request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [uuid, password] = (request as RpcRequestPreinit<[string, string]>).params

    await this.setCurrentUserOrThrow(uuid, password)
    await this.setStoredPasswordOrThrow(uuid, password)
    return Ok.void()
  }

  async brume_getCurrentUser(request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<UserData>, Error>> {
    const userSession = this.#user

    if (userSession == null)
      return new Ok(undefined)

    const userQuery = BgUser.schema(userSession.user.uuid, this.storage)
    const userState = await userQuery.state

    return new Ok(userState.current?.get())
  }


  async brume_switchEthereumChain(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [sessionId, chainId] = (request as RpcRequestPreinit<[string, string]>).params

    const { storage } = Option.unwrap(this.#user)

    const chain = Option.unwrap(chainDataByChainId[Number(chainId)])

    const sessionQuery = BgSession.schema(sessionId, storage)
    const sessionState = await sessionQuery.state
    const sessionData = Option.unwrap(sessionState.data?.get())

    if (sessionData.type === "wc")
      throw new Error("Unexpected WalletConnect session")

    await sessionQuery.mutate(() => new Some(new Data({ ...sessionData, chain })))

    for (const script of Option.wrap(this.scriptsBySession.get(sessionId)).unwrapOr([])) {
      await script.requestOrThrow({
        method: "chainChanged",
        params: [ZeroHexAsInteger.fromOrThrow(chain.chainId)]
      }).then(r => r.unwrap())

      await script.requestOrThrow({
        method: "networkChanged",
        params: [chain.chainId.toString()]
      }).then(r => r.unwrap())
    }

    return Ok.void()
  }

  async brume_disconnect(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [id] = (request as RpcRequestPreinit<[string]>).params

    const { storage } = Option.unwrap(this.#user)

    const sessionQuery = BgSession.schema(id, storage)
    await sessionQuery.delete()

    const wcSession = this.wcBySession.get(id)

    if (wcSession != null) {
      await wcSession.tryClose(undefined).then(r => r.unwrap())
      this.wcBySession.delete(id)
    }

    for (const script of Option.wrap(this.scriptsBySession.get(id)).unwrapOr([])) {
      await script.requestOrThrow({
        method: "accountsChanged",
        params: [[]]
      }).then(r => r.unwrap())

      this.sessionByScript.delete(script.name)
    }

    this.scriptsBySession.delete(id)

    return Ok.void()
  }

  async brume_encrypt(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<[string, string], Error>> {
    const [plainBase64] = (request as RpcRequestPreinit<[string]>).params

    const { crypter } = Option.unwrap(this.#user)

    const plain = Base64.get().decodePaddedOrThrow(plainBase64).copyAndDispose()
    const iv = Bytes.random(16)
    const cipher = await crypter.encryptOrThrow(plain, iv)

    const ivBase64 = Base64.get().encodePaddedOrThrow(iv)
    const cipherBase64 = Base64.get().encodePaddedOrThrow(cipher)

    return new Ok([ivBase64, cipherBase64])
  }

  async brume_decrypt(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    const [ivBase64, cipherBase64] = (request as RpcRequestPreinit<[string, string]>).params

    const { crypter } = Option.unwrap(this.#user)

    const iv = Base64.get().decodePaddedOrThrow(ivBase64).copyAndDispose()
    const cipher = Base64.get().decodePaddedOrThrow(cipherBase64).copyAndDispose()
    const plain = await crypter.decryptOrThrow(cipher, iv)

    const plainBase64 = Base64.get().encodePaddedOrThrow(plain)

    return new Ok(plainBase64)
  }

  async brume_createSeed(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [seed] = (request as RpcRequestPreinit<[SeedData]>).params

    const { storage } = Option.unwrap(this.#user)

    const seedQuery = BgSeed.schema(seed.uuid, storage)
    await seedQuery.mutate(Mutators.data(seed))

    return Ok.void()
  }

  async brume_createWallet(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [wallet] = (request as RpcRequestPreinit<[WalletData]>).params

    const { storage } = Option.unwrap(this.#user)

    const walletQuery = BgWallet.schema(wallet.uuid, storage)
    await walletQuery.mutate(Mutators.data(wallet))

    return Ok.void()
  }

  async #getOrTakeEthBrumeOrThrow(uuid: string): Promise<EthBrume> {
    return await this.brumeByUuid.lock(async brumeByUuid => {
      const brume = brumeByUuid.get(uuid)

      if (brume == null) {
        const brumes = Option.unwrap(this.#eths)
        const brume = await Pool.takeCryptoRandomOrThrow(brumes).then(r => r.unwrap().inner.inner)

        brumeByUuid.set(uuid, brume)

        return brume
      }

      return brume
    })
  }

  async brume_get_global(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<RawState>, Error>> {
    const [cacheKey] = (request as RpcRequestPreinit<[string]>).params

    const state = await core.getOrCreateMutex(cacheKey).lock(async () => {
      const cached = core.storeds.get(cacheKey)

      if (cached != null)
        return cached

      const stored = await this.storage.getOrThrow(cacheKey)
      core.storeds.set(cacheKey, stored)
      core.unstoreds.delete(cacheKey)

      await core.onState.emit("*", cacheKey)
      await core.onState.emit(cacheKey, cacheKey)

      return stored
    })

    const onState = async () => {
      const stored = core.storeds.get(cacheKey)

      foreground.requestOrThrow<void>({
        method: "brume_update",
        params: [cacheKey, stored]
      }).then(r => r.unwrap()).catch(console.warn)

      return new None()
    }

    core.onState.on(cacheKey, onState, { passive: true })

    foreground.events.on("close", () => {
      core.onState.off(cacheKey, onState)
      return new None()
    })

    return new Ok(state)
  }

  async brume_get_user(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<RawState>, Error>> {
    const [cacheKey] = (request as RpcRequestPreinit<[string]>).params

    const { storage } = Option.unwrap(this.#user)

    const state = await core.getOrCreateMutex(cacheKey).lock(async () => {
      const cached = core.storeds.get(cacheKey)

      if (cached != null)
        return cached

      const stored = await storage.getOrThrow(cacheKey)

      core.storeds.set(cacheKey, stored)
      core.unstoreds.delete(cacheKey)

      await core.onState.emit("*", cacheKey)
      await core.onState.emit(cacheKey, cacheKey)

      return stored
    })

    const onState = async () => {
      const stored = core.storeds.get(cacheKey)

      foreground.requestOrThrow<void>({
        method: "brume_update",
        params: [cacheKey, stored]
      }).then(r => r.unwrap()).catch(console.warn)

      return new None()
    }

    core.onState.on(cacheKey, onState, { passive: true })

    foreground.events.on("close", () => {
      core.onState.off(cacheKey, onState)
      return new None()
    })

    return new Ok(state)
  }

  async brume_set_user(request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    const [cacheKey, rawState] = (request as RpcRequestPreinit<[string, Nullable<RawState>]>).params

    const { storage } = Option.unwrap(this.#user)

    if (cacheKey.startsWith("session/")) {
      const storage2 = new SessionStorage(storage)
      storage2.setOrThrow(cacheKey, rawState as any)
    } else {
      storage.setOrThrow(cacheKey, rawState)
    }

    core.storeds.set(cacheKey, rawState)
    core.unstoreds.delete(cacheKey)

    await core.onState.emit("*", cacheKey)
    await core.onState.emit(cacheKey, cacheKey)

    return Ok.void()
  }

  async brume_eth_fetch(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    const [uuid, chainId, subrequest] = (request as RpcRequestPreinit<[string, number, EthereumQueryKey<unknown> & EthereumFetchParams]>).params

    const chainData = Option.unwrap(chainDataByChainId[chainId])

    const brume = await this.#getOrTakeEthBrumeOrThrow(uuid)

    const context: BgEthereumContext = { chain: chainData, brume }

    return await BgEthereumContext.fetchOrFail<unknown>(context, subrequest)
  }

  async routeCustomOrThrow(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown> & EthereumFetchParams, storage: IDBStorage): Promise<SimpleQuery<any, any, Error>> {
    if (request.method === BgEns.Lookup.method)
      return await BgEns.Lookup.parseOrThrow(ethereum, request, storage)
    if (request.method === BgEns.Reverse.method)
      return await BgEns.Reverse.parseOrThrow(ethereum, request, storage)
    if (request.method === BgSimulation.method)
      return await BgSimulation.parseOrThrow(ethereum, request, storage)

    throw new Error(`Unknown fetcher`)
  }

  async brume_eth_custom_fetch(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    const [uuid, chainId, subrequest] = (request as RpcRequestPreinit<[string, number, EthereumQueryKey<unknown> & EthereumFetchParams]>).params

    const { storage } = Option.unwrap(this.#user)

    const chainData = Option.unwrap(chainDataByChainId[chainId])

    const brume = await this.#getOrTakeEthBrumeOrThrow(uuid)
    const ethereum: BgEthereumContext = { chain: chainData, brume }

    const query = await this.routeCustomOrThrow(ethereum, subrequest, storage)

    try { await query.fetch() } catch { }

    const stored = core.storeds.get(query.cacheKey)
    const unstored = await core.unstoreOrThrow<any, unknown, Error>(stored, { key: query.cacheKey })

    return Option.unwrap(unstored.current)
  }

  async brume_log(request: RpcRequestInit<unknown>): Promise<Result<void, Error>> {
    const { storage } = Option.unwrap(this.#user)

    const logs = await BgSettings.Logs.schema(storage).state

    if (logs.real?.current?.get() !== true)
      return Ok.void()

    using circuit = await Pool.takeCryptoRandomOrThrow(this.circuits).then(r => r.unwrap().inner.inner)

    const body = JSON.stringify({ tor: true, method: "eth_getBalance" })

    using stream = await Circuits.openAsOrThrow(circuit, "https://proxy.brume.money")
    await fetch("https://proxy.brume.money", { method: "POST", body, stream: stream.inner })

    return Ok.void()
  }

  async #wcReconnectAllOrThrow(): Promise<void> {
    const { storage } = Option.unwrap(this.#user)

    const persSessionsQuery = BgSession.All.Persistent.schema(storage)
    const persSessionsState = await persSessionsQuery.state

    for (const sessionRef of Option.wrap(persSessionsState?.data?.get()).unwrapOr([]))
      this.#wcResolveAndReconnectOrThrow(sessionRef).catch(console.warn)

    return
  }

  async #wcResolveAndReconnectOrThrow(sessionRef: SessionRef): Promise<void> {
    if (this.wcBySession.has(sessionRef.id))
      return

    const { storage } = Option.unwrap(this.#user)

    const sessionQuery = BgSession.schema(sessionRef.id, storage)
    const sessionState = await sessionQuery.state
    const sessionDataOpt = Option.wrap(sessionState.data?.get())

    if (sessionDataOpt.isNone())
      return
    if (sessionDataOpt.inner.type !== "wc")
      return

    const sessionResult = await this.#tryWcReconnect(sessionDataOpt.inner)

    const { id } = sessionRef
    const error = sessionResult.mapErrSync(RpcError.rewrap).err().inner
    await Status.schema(id).mutate(Mutators.data<StatusData, never>({ id, error }))
  }

  async #tryWcReconnect(sessionData: WcSessionData): Promise<Result<WcSession, Error>> {
    return await Result.runAndDoubleWrap(() => this.#wcReconnectOrThrow(sessionData))
  }

  async #wcReconnectOrThrow(sessionData: WcSessionData): Promise<WcSession> {
    const { storage } = Option.unwrap(this.#user)

    const { topic, metadata, sessionKeyBase64, authKeyJwk, wallets, settlement } = sessionData

    const firstWalletRef = Option.unwrap(wallets[0])

    const authKey = await Ed25519.get().PrivateKey.importJwkOrThrow(authKeyJwk)

    const brume = await WcBrume.createOrThrow(this.circuits, authKey)
    const irn = new IrnBrume(brume)

    const rawSessionKey = Base64.get().decodePaddedOrThrow(sessionKeyBase64).copyAndDispose()
    const sessionKey = Bytes.castOrThrow(rawSessionKey, 32)
    const sessionClient = CryptoClient.tryNew(topic, sessionKey, irn).unwrap()
    const session = new WcSession(sessionClient, metadata)

    await irn.trySubscribe(topic).then(r => r.unwrap())

    /**
     * When settlement has been interrupted
     */
    if (settlement != null) {
      await session.client.waitOrThrow<boolean>(settlement)
        .then(r => r.unwrap())
        .then(Result.assert)
        .then(r => r.unwrap())

      const sessionQuery = BgSession.schema(sessionData.id, storage)
      await sessionQuery.mutate(Mutators.mapExistingData(d => d.mapSync(x => ({ ...x, settlement: undefined }))))
    }

    const onRequest = async (suprequest: RpcRequestPreinit<unknown>) => {
      if (suprequest.method !== "wc_sessionRequest")
        return new None()
      const { chainId, request } = (suprequest as RpcRequestInit<WcSessionRequestParams>).params

      const chainData = Option.unwrap(chainDataByChainId[Number(chainId.split(":")[1])])

      const brume = await this.#getOrTakeEthBrumeOrThrow(firstWalletRef.uuid)

      const ethereum: BgEthereumContext = { chain: chainData, brume }

      if (request.method === "eth_sendTransaction")
        return new Some(await this.eth_sendTransaction(ethereum, sessionData, request))
      if (request.method === "personal_sign")
        return new Some(await this.personal_sign(ethereum, sessionData, request))
      if (request.method === "eth_signTypedData_v4")
        return new Some(await this.eth_signTypedData_v4(ethereum, sessionData, request))
      return new None()
    }

    const onCloseOrError = async () => {
      session.client.events.off("request", onRequest)
      session.client.irn.events.off("close", onCloseOrError)
      session.client.irn.events.off("error", onCloseOrError)
      return new None()
    }

    session.client.events.on("request", onRequest, { passive: true })
    session.client.irn.events.on("close", onCloseOrError, { passive: true })
    session.client.irn.events.on("error", onCloseOrError, { passive: true })

    this.wcBySession.set(sessionData.id, session)

    return session
  }

  async brume_wc_connect(foreground: RpcRouter, request: RpcRequestPreinit<unknown>): Promise<Result<WcMetadata, Error>> {
    const [rawWcUrl, walletId] = (request as RpcRequestPreinit<[string, string]>).params

    const { storage } = Option.unwrap(this.#user)

    const walletState = await BgWallet.schema(walletId, storage).state
    const walletData = Option.unwrap(walletState.real?.current.ok().get())

    const wcUrl = new URL(rawWcUrl)
    const pairParams = await Wc.tryParse(wcUrl).then(r => r.unwrap())

    const brumes = Option.unwrap(this.#wcs)
    const brume = await Pool.takeCryptoRandomOrThrow(brumes).then(r => r.unwrap().inner.inner)
    const irn = new IrnBrume(brume)

    const [session, settlement] = await Wc.tryPair(irn, pairParams, walletData.address).then(r => r.unwrap())

    const originData: OriginData = {
      origin: `wc://${randomUUID()}`,
      title: session.metadata.name,
      description: session.metadata.description,
    }

    const originQuery = BgOrigin.schema(originData.origin, storage)
    await originQuery.mutate(Mutators.data(originData))

    const authKeyJwk = await session.client.irn.brume.key.exportJwkOrThrow()
    const sessionKeyBase64 = Base64.get().encodePaddedOrThrow(session.client.key)

    const sessionData: WcSessionData = {
      type: "wc",
      id: randomUUID(),
      origin: originData.origin,
      metadata: session.metadata,
      persist: true,
      wallets: [WalletRef.from(walletData)],
      relay: Wc.RELAY,
      topic: session.client.topic,
      sessionKeyBase64: sessionKeyBase64,
      authKeyJwk: authKeyJwk,
      settlement: settlement.receipt
    }

    const sessionQuery = BgSession.schema(sessionData.id, storage)
    await sessionQuery.mutate(Mutators.data<SessionData, never>(sessionData))

    /**
     * Service worker can die here
     */
    await settlement.promise
      .then(r => r.unwrap().unwrap())
      .then(Result.assert)
      .then(r => r.unwrap())

    await sessionQuery.mutate(Mutators.mapExistingData(d => d.mapSync(x => ({ ...x, settlement: undefined }))))

    const onRequest = async (suprequest: RpcRequestPreinit<unknown>) => {
      if (suprequest.method !== "wc_sessionRequest")
        return new None()

      const { chainId, request } = (suprequest as RpcRequestInit<WcSessionRequestParams>).params

      const walletState = await BgWallet.schema(walletId, storage).state
      const walletData = Option.unwrap(walletState.real?.current.ok().get())

      const chainData = Option.unwrap(chainDataByChainId[Number(chainId.split(":")[1])])
      const brume = await this.#getOrTakeEthBrumeOrThrow(walletData.uuid)

      const ethereum: BgEthereumContext = { chain: chainData, brume }

      if (request.method === "eth_sendTransaction")
        return new Some(await this.eth_sendTransaction(ethereum, sessionData, request))
      if (request.method === "personal_sign")
        return new Some(await this.personal_sign(ethereum, sessionData, request))
      if (request.method === "eth_signTypedData_v4")
        return new Some(await this.eth_signTypedData_v4(ethereum, sessionData, request))
      return new None()
    }

    const onCloseOrError = async () => {
      session.client.events.off("request", onRequest)
      session.client.irn.events.off("close", onCloseOrError)
      session.client.irn.events.off("error", onCloseOrError)
      return new None()
    }

    session.client.events.on("request", onRequest, { passive: true })
    session.client.irn.events.on("close", onCloseOrError, { passive: true })
    session.client.irn.events.on("error", onCloseOrError, { passive: true })

    this.wcBySession.set(sessionData.id, session)

    const { id } = sessionData
    await Status.schema(id).mutate(Mutators.data<StatusData, never>({ id }))

    const icons = session.metadata.icons.map<BlobbyRef>(x => ({ ref: true, id: x }))
    await originQuery.mutate(Mutators.mapExistingData(d => d.mapSync(x => ({ ...x, icons }))))

    for (const iconUrl of session.metadata.icons) {
      (async () => {
        using circuit = await Pool.takeCryptoRandomOrThrow(this.circuits).then(r => r.unwrap().inner.inner)

        console.debug(`Fetching ${iconUrl} with ${circuit.id}`)

        using stream = await Circuits.openAsOrThrow(circuit, iconUrl)
        const iconRes = await fetch(iconUrl, { stream: stream.inner })
        const iconBlob = await iconRes.blob()

        if (!Mime.isImage(iconBlob.type))
          throw new Error()

        const iconData = await Blobs.readAsDataUrlOrThrow(iconBlob)

        const blobbyQuery = BgBlobby.schema(iconUrl, storage)
        const blobbyData = { id: iconUrl, data: iconData }
        await blobbyQuery.mutate(Mutators.data(blobbyData))
      })().catch(console.warn)
    }

    return new Ok(session.metadata)
  }

}

async function initBerith() {
  Ed25519.set(await Ed25519.fromSafeOrBerith())
  X25519.set(await X25519.fromSafeOrBerith())
}

async function initEligos() {
  Secp256k1.set(await Secp256k1.fromEligos())
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

const init = Result.runAndDoubleWrap(() => initOrThrow())

async function initOrThrow() {
  await Promise.all([initBerith(), initEligos(), initMorax(), initAlocer(), initZepar()])

  const gt = globalThis as any
  gt.Console = Console
  gt.Echalote = Echalote
  gt.Cadenas = Cadenas
  gt.Fleche = Fleche
  gt.Kcp = Kcp
  gt.Smux = Smux

  const start = Date.now()

  const storage = IDBStorage.createOrThrow({ name: "memory" })
  const global = new Global(storage)

  await global.initOrThrow()

  console.log(`Started in ${Date.now() - start}ms`)

  return global
}

if (isWebsite() || isAndroidApp()) {
  const onSkipWaiting = (event: ExtendableMessageEvent) =>
    self.skipWaiting()

  const onForeground = async (event: ExtendableMessageEvent) => {
    const port = event.ports[0]

    const name = `foreground-${randomUUID().slice(0, 8)}`
    const router = new MessageRpcRouter(name, port)

    const onRequest = async (request: RpcRequestInit<unknown>) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      return await inited.get().routeForegroundOrThrow(router, request)
    }

    router.events.on("request", onRequest, { passive: true })

    const onClose = () => {
      using _ = router

      router.events.off("request", onRequest)
      router.port.close()

      return new None()
    }

    router.events.on("close", onClose, { passive: true })

    port.start()

    await router.waitHelloOrThrow(AbortSignals.timeout(1000))

    router.runPingLoop()
  }

  self.addEventListener("message", (event) => {
    if (event.origin !== location.origin)
      return
    if (event.data === "SKIP_WAITING")
      return void onSkipWaiting(event)
    if (event.data === "FOREGROUND->BACKGROUND")
      return void onForeground(event)
    return
  })
}

if (isAppleApp()) {
  const onForeground = async (event: ExtendableMessageEvent) => {
    const port = event.ports[0]

    const name = `foreground-${randomUUID().slice(0, 8)}`
    const router = new MessageRpcRouter(name, port)

    const onRequest = async (request: RpcRequestInit<unknown>) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      return await inited.get().routeForegroundOrThrow(router, request)
    }

    router.events.on("request", onRequest, { passive: true })

    const onClose = () => {
      using _ = router

      router.events.off("request", onRequest)
      router.port.close()

      return new None()
    }

    router.events.on("close", onClose, { passive: true })

    port.start()

    await router.waitHelloOrThrow(AbortSignals.timeout(1000))

    router.runPingLoop()
  }

  self.addEventListener("message", (event) => {
    if (event.origin !== location.origin)
      return
    if (event.data === "FOREGROUND->BACKGROUND")
      return void onForeground(event)
    return
  })
}

if (isExtension()) {
  const onContentScript = async (port: chrome.runtime.Port) => {
    const name = `content_script-${randomUUID().slice(0, 8)}`
    const router = new ExtensionRpcRouter(name, port)

    router.events.on("request", async (request) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      return await inited.get().tryRouteContentScript(router, request)
    })

    await router.waitHelloOrThrow(AbortSignals.timeout(1000))
  }

  const onForeground = async (port: chrome.runtime.Port) => {
    const name = `foreground-${randomUUID().slice(0, 8)}`
    const router = new ExtensionRpcRouter(name, port)

    router.events.on("request", async (request) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      return await inited.get().routeForegroundOrThrow(router, request)
    })

    await router.waitHelloOrThrow(AbortSignals.timeout(1000))
  }

  const onOffscreen = async (port: chrome.runtime.Port) => {
    const name = `offscreen-${randomUUID().slice(0, 8)}`
    const router = new ExtensionRpcRouter(name, port)

    console.log(name, "connected")

    await router.waitHelloOrThrow(AbortSignals.timeout(1000))
  }

  browser.runtime.onConnect.addListener(port => {
    if (port.sender?.id !== browser.runtime.id)
      return
    if (port.name === "foreground->background")
      return void onForeground(port)
    if (port.name === "content_script->background")
      return void onContentScript(port)
    if (port.name === "offscreen->background")
      return void onOffscreen(port)
    return
  })

  if (isChromeExtension()) {
    await BrowserError.runOrThrow(() => browser.offscreen.createDocument({
      url: "/offscreen.html",
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification: "We need to run workers"
    }))

    browser.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
      const inited = await init

      if (inited.isErr())
        return

      const window = await BrowserError.runOrThrow(() => browser.windows.getCurrent())

      if (window.width == null)
        return
      if (window.height == null)
        return
      if (window.left == null)
        return
      if (window.top == null)
        return

      const x = window.left + window.width - 220
      const y = window.top + 360

      await inited.get().openOrFocusPopupOrThrow("", { x, y })
    })
  }

  if (isFirefoxExtension()) {
    browser.browserAction.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
      const inited = await init

      if (inited.isErr())
        return

      const window = await BrowserError.runOrThrow(() => browser.windows.getCurrent())

      if (window.width == null)
        return
      if (window.height == null)
        return
      if (window.left == null)
        return
      if (window.top == null)
        return

      const x = window.left + window.width - 220
      const y = window.top + 360

      await inited.get().openOrFocusPopupOrThrow("", { x, y })
    })
  }

  if (isSafariExtension() && isIpad()) {
    browser.browserAction.setPopup({ popup: "action.html" })
  }

  if (isSafariExtension() && !isIpad()) {
    browser.browserAction.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
      const inited = await init

      if (inited.isErr())
        return

      const window = await BrowserError.runOrThrow(() => browser.windows.getCurrent())

      if (window.width == null)
        return
      if (window.height == null)
        return
      if (window.left == null)
        return
      if (window.top == null)
        return

      const x = window.left + 220
      const y = window.top + 360

      await inited.get().openOrFocusPopupOrThrow("", { x, y })
    })
  }
}