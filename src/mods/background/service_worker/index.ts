import "@hazae41/symbol-dispose-polyfill"

import { Blobs } from "@/libs/blobs/blobs"
import { browser, tryBrowser } from "@/libs/browser/browser"
import { ExtensionPort, Port, WebsitePort } from "@/libs/channel/channel"
import { chainByChainId } from "@/libs/ethereum/mods/chain"
import { Mime } from "@/libs/mime/mime"
import { Mouse } from "@/libs/mouse/mouse"
import { Strings } from "@/libs/strings/strings"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { createTorPool, tryCreateTor } from "@/libs/tor/tors/tors"
import { Url, qurl } from "@/libs/url/url"
import { CryptoClient } from "@/libs/wconn/mods/crypto/client"
import { IrnBrume } from "@/libs/wconn/mods/irn/irn"
import { Wc, WcMetadata, WcSession, WcSessionRequestParams } from "@/libs/wconn/mods/wc/wc"
import { Mutators } from "@/libs/xswr/mutators"
import { UnauthorizedError } from "@/mods/foreground/errors/errors"
import { Base16 } from "@hazae41/base16"
import { Base58 } from "@hazae41/base58"
import { Base64 } from "@hazae41/base64"
import { Base64Url } from "@hazae41/base64url"
import { Bytes } from "@hazae41/bytes"
import { Cadenas } from "@hazae41/cadenas"
import { ChaCha20Poly1305 } from "@hazae41/chacha20poly1305"
import { Disposer } from "@hazae41/cleaner"
import { ZeroHexString } from "@hazae41/cubane"
import { Circuit, Echalote, Fallback, TorClientDuplex } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Fleche } from "@hazae41/fleche"
import { Future } from "@hazae41/future"
import { IDBStorage, RawState, SimpleQuery, State, core } from "@hazae41/glacier"
import { RpcError, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { Kcp } from "@hazae41/kcp"
import { Keccak256 } from "@hazae41/keccak256"
import { Mutex } from "@hazae41/mutex"
import { None, Nullable, Option, Some } from "@hazae41/option"
import { Pool } from "@hazae41/piscine"
import { SuperEventTarget } from "@hazae41/plume"
import { Catched, Err, Ok, Panic, Result } from "@hazae41/result"
import { Ripemd160 } from "@hazae41/ripemd160"
import { Sha1 } from "@hazae41/sha1"
import { Smux } from "@hazae41/smux"
import { X25519 } from "@hazae41/x25519"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { Blobby, BlobbyRef } from "./entities/blobbys/data"
import { EthBrume, WcBrume } from "./entities/brumes/data"
import { Origin, OriginData, PreOriginData } from "./entities/origins/data"
import { BgAppRequests } from "./entities/requests/all/data"
import { AppRequest, AppRequestData, BgAppRequest } from "./entities/requests/data"
import { Seed, SeedData } from "./entities/seeds/data"
import { PersistentSessions } from "./entities/sessions/all/data"
import { ExSessionData, Session, SessionByOrigin, SessionData, SessionRef, WcSessionData } from "./entities/sessions/data"
import { Status, StatusData } from "./entities/sessions/status/data"
import { BgSettings } from "./entities/settings/data"
import { BgSignature } from "./entities/signatures/data"
import { BgContractToken, BgNativeToken } from "./entities/tokens/data"
import { BgUnknown } from "./entities/unknown/data"
import { Users } from "./entities/users/all/data"
import { User, UserData, UserInit, UserSession, getCurrentUser } from "./entities/users/data"
import { BgEns, BgEthereumContext, BgPair, EthereumFetchParams, EthereumQueryKey, Wallet, WalletData, WalletRef, tryEthereumFetch } from "./entities/wallets/data"
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

export class Global {

  readonly events = new SuperEventTarget<{
    "popup_hello": (foreground: Port) => Result<void, Error>
    "response": (response: RpcResponseInit<unknown>) => Result<void, Error>
  }>()

  #user?: UserSession
  #path: string = "/"

  readonly circuits: Mutex<Pool<Disposer<Circuit>, Error>>

  #wcs?: Mutex<Pool<Disposer<WcBrume>, Error>>
  #eths?: Mutex<Pool<Disposer<EthBrume>, Error>>

  readonly brumeByUuid = new Mutex(new Map<string, EthBrume>())

  readonly scriptsBySession = new Map<string, Set<Port>>()

  readonly sessionByScript = new Map<string, Mutex<Slot<string>>>()

  readonly wcBySession = new Map<string, WcSession>()

  /**
   * Current popup
   */
  readonly popup = new Mutex<Slot<PopupData>>({})

  constructor(
    readonly tors: Mutex<Pool<Disposer<TorClientDuplex>, Error>>,
    readonly storage: IDBStorage
  ) {
    this.circuits = new Mutex(Circuits.createPool(this.tors.inner, { capacity: 9 }))

    core.onState.on(BgAppRequests.key, async () => {
      const state = core.getStateSync(BgAppRequests.key) as State<AppRequest[], never>

      const badge = Option
        .wrap(state?.data?.inner?.length)
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

  async trySetCurrentUser(uuid: Nullable<string>, password: Nullable<string>): Promise<Result<Nullable<UserSession>, Error>> {
    return await Result.unthrow(async t => {
      if (uuid == null)
        return new Ok(undefined)
      if (password == null)
        return new Ok(undefined)

      const userQuery = User.schema(uuid, this.storage)
      const userState = await userQuery.state.then(r => r.throw(t))
      const userData = Option.wrap(userState.current?.get()).ok().throw(t)

      const user: User = { ref: true, uuid: userData.uuid }

      const { storage, hasher, crypter } = await tryCreateUserStorage(userData, password).then(r => r.throw(t))

      const currentUserQuery = getCurrentUser()
      await currentUserQuery.tryMutate(Mutators.data<User, never>(user)).then(r => r.throw(t))

      const userSession: UserSession = { user, storage, hasher, crypter }

      this.#user = userSession

      await this.#tryWcReconnectAll().then(r => r.throw(t))

      this.#wcs = new Mutex(WcBrume.createPool(this.circuits, { capacity: 1 }))
      this.#eths = new Mutex(EthBrume.createPool(this.circuits, chainByChainId, { capacity: 1 }))

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

  async tryOpenOrFocusPopup(pathname: string, mouse: Mouse, force?: boolean): Promise<Result<PopupData, Error>> {
    return await Result.unthrow(async t => {
      return await this.popup.lock(async (slot) => {
        if (slot.current != null) {
          const windowId = Option.wrap(slot.current.window.id).ok().throw(t)
          const tabId = Option.wrap(slot.current.window.tabs?.[0].id).ok().throw(t)

          const url = force ? `popup.html#${pathname}` : undefined

          await tryBrowser(async () => {
            return await browser.tabs.update(tabId, { url, highlighted: true })
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
    else
      return await this.tryRequestNoPopup(request)
  }

  async tryRequestNoPopup<T>(request: AppRequestData): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const requestQuery = BgAppRequest.schema(request.id)
      await requestQuery.tryMutate(Mutators.data<AppRequestData, never>(request)).then(r => r.throw(t))

      const done = new Future<Result<void, Error>>()

      try {
        return await this.tryWaitResponse(request.id, done)
      } finally {
        await requestQuery.tryDelete().then(r => r.throw(t))
        done.resolve(Ok.void())
      }
    })
  }

  async tryRequestPopup<T>(request: AppRequestData, mouse: Mouse, force?: boolean): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const requestQuery = BgAppRequest.schema(request.id)
      await requestQuery.tryMutate(Mutators.data<AppRequestData, never>(request)).then(r => r.throw(t))

      const done = new Future<Result<void, Error>>()

      try {
        const { id, method, params } = request
        const url = qurl(`/${method}?id=${id}`, params)

        const popup = await this.tryOpenOrFocusPopup(url, mouse, force).then(r => r.throw(t))
        const response = await this.tryWaitPopupResponse<T>(request.id, popup, done).then(r => r.throw(t))

        return new Ok(response)
      } finally {
        await requestQuery.tryDelete().then(r => r.throw(t))
        done.resolve(Ok.void())
      }
    })
  }

  async tryWaitResponse<T>(id: string, done: Future<Result<void, Error>>) {
    const future = new Future<Result<RpcResponse<T>, Error>>()

    const onResponse = async (init: RpcResponseInit<any>) => {
      if (init.id !== id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(new Ok(response))
      return new Some(await done.promise)
    }

    try {
      this.events.on("response", onResponse, { passive: true })

      return await future.promise
    } finally {
      this.events.off("response", onResponse)
    }
  }

  async tryWaitPopupResponse<T>(id: string, popup: PopupData, done: Future<Result<void, Error>>) {
    const future = new Future<Result<RpcResponse<T>, Error>>()

    const onResponse = async (init: RpcResponseInit<any>) => {
      if (init.id !== id)
        return new None()

      const response = RpcResponse.from<T>(init)
      future.resolve(new Ok(response))
      return new Some(await done.promise)
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

  async tryGetExtensionSession(script: Port, mouse: Mouse, force: boolean): Promise<Result<Nullable<SessionData>, Error>> {
    return await Result.unthrow(async t => {
      let mutex = this.sessionByScript.get(script.name)

      if (mutex == null) {
        mutex = new Mutex<Slot<string>>({})
        this.sessionByScript.set(script.name, mutex)
      }

      return await mutex.lock(async slot => {
        const currentSession = slot.current

        if (currentSession != null) {
          const { storage } = Option.wrap(this.#user).ok().throw(t)

          const sessionQuery = Session.schema(currentSession, storage)
          const sessionState = await sessionQuery.state.then(r => r.throw(t))
          const sessionData = Option.wrap(sessionState.data?.inner).ok().throw(t)

          return new Ok(sessionData)
        }

        const preOriginData = await script.tryRequest<PreOriginData>({
          method: "brume_origin"
        }).then(r => r.throw(t).throw(t))

        if (this.#user == null && !force)
          return new Ok(undefined)

        if (this.#user == null && force)
          await this.tryOpenOrFocusPopup("/", mouse).then(r => r.throw(t))

        const { storage } = Option.wrap(this.#user).ok().throw(t)

        const { origin, title, description } = preOriginData
        const iconQuery = Blobby.schema(origin, storage)
        const iconRef = BlobbyRef.create(origin)

        if (preOriginData.icon) {
          const iconData = { id: origin, data: preOriginData.icon }
          await iconQuery.tryMutate(Mutators.data(iconData)).then(r => r.throw(t))
        }

        const originQuery = Origin.schema(origin, storage)
        const originData: OriginData = { origin, title, description, icons: [iconRef] }
        await originQuery.tryMutate(Mutators.data(originData)).then(r => r.throw(t))

        const sessionByOriginQuery = SessionByOrigin.schema(origin, storage)
        const sessionByOriginState = await sessionByOriginQuery.state.then(r => r.throw(t))

        if (sessionByOriginState.data != null) {
          const sessionId = sessionByOriginState.data.inner.id

          const sessionQuery = Session.schema(sessionId, storage)
          const sessionState = await sessionQuery.state.then(r => r.throw(t))
          const sessionData = Option.wrap(sessionState.data?.inner).ok().throw(t)

          slot.current = sessionId

          let scripts = this.scriptsBySession.get(sessionId)

          if (scripts == null) {
            scripts = new Set()
            this.scriptsBySession.set(sessionId, scripts)
          }

          scripts.add(script)

          const { id } = sessionData
          await Status.schema(id).tryMutate(Mutators.data<StatusData, never>({ id })).then(r => r.throw(t))

          script.events.on("close", async () => {
            scripts!.delete(script)
            this.sessionByScript.delete(script.name)

            if (scripts!.size === 0) {
              const { id } = sessionData
              await Status.schema(id).tryDelete().then(r => r.throw(t))
            }

            return new None()
          })

          const { chainId } = sessionData.chain

          if (chainId !== 1) {
            await script.tryRequest<void>({
              method: "chainChanged",
              params: [ZeroHexString.from(chainId)]
            }).then(r => r.throw(t).throw(t))

            await script.tryRequest({
              method: "networkChanged",
              params: [chainId.toString()]
            }).then(r => r.throw(t).throw(t))
          }

          {
            const addresses = Result.all(await Promise.all(sessionData.wallets.map(async wallet => {
              return await Result.unthrow<Result<string, Error>>(async t => {
                const walletQuery = Wallet.schema(wallet.uuid, storage)
                const walletState = await walletQuery.state.then(r => r.throw(t))
                const walletData = Option.wrap(walletState.data?.inner).ok().throw(t)

                return new Ok(walletData.address)
              })
            }))).throw(t)

            await script.tryRequest({
              method: "accountsChanged",
              params: [addresses]
            }).then(r => r.throw(t).throw(t))
          }

          return new Ok(sessionData)
        }

        if (!force)
          return new Ok(undefined)

        const [persistent, chainId, wallets] = await this.tryRequestPopup<[boolean, number, Wallet[]]>({
          id: crypto.randomUUID(),
          origin: origin,
          method: "eth_requestAccounts",
          params: {}
        }, mouse, true).then(r => r.throw(t).throw(t))

        const chain = Option.wrap(chainByChainId[chainId]).ok().throw(t)

        const sessionData: ExSessionData = {
          type: "ex",
          id: crypto.randomUUID(),
          origin: origin,
          persist: persistent,
          wallets: wallets.map(wallet => WalletRef.from(wallet)),
          chain: chain
        }

        const sessionQuery = Session.schema(sessionData.id, storage)
        await sessionQuery.tryMutate(Mutators.data<SessionData, never>(sessionData)).then(r => r.throw(t))

        slot.current = sessionData.id

        let scripts = this.scriptsBySession.get(sessionData.id)

        if (scripts == null) {
          scripts = new Set()
          this.scriptsBySession.set(sessionData.id, scripts)
        }

        scripts.add(script)

        const { id } = sessionData
        await Status.schema(id).tryMutate(Mutators.data<StatusData, never>({ id })).then(r => r.throw(t))

        script.events.on("close", async () => {
          scripts!.delete(script)
          this.sessionByScript.delete(script.name)

          if (scripts!.size === 0) {
            const { id } = sessionData
            await Status.schema(id).tryDelete().then(r => r.inspectErrSync(console.warn))
          }

          return new None()
        })

        if (chainId !== 1) {
          await script.tryRequest<void>({
            method: "chainChanged",
            params: [ZeroHexString.from(chainId)]
          }).then(r => r.throw(t).throw(t))

          await script.tryRequest({
            method: "networkChanged",
            params: [chainId.toString()]
          }).then(r => r.throw(t).throw(t))
        }

        {
          const addresses = Result.all(await Promise.all(sessionData.wallets.map(async wallet => {
            return await Result.unthrow<Result<string, Error>>(async t => {
              const walletQuery = Wallet.schema(wallet.uuid, storage)
              const walletState = await walletQuery.state.then(r => r.throw(t))
              const walletData = Option.wrap(walletState.data?.inner).ok().throw(t)

              return new Ok(walletData.address)
            })
          }))).throw(t)

          await script.tryRequest({
            method: "accountsChanged",
            params: [addresses]
          }).then(r => r.throw(t).throw(t))
        }

        return new Ok(sessionData)
      })
    })
  }

  async tryRouteContentScript(script: Port, request: RpcRequestPreinit<unknown>) {
    if (request.method === "brume_icon")
      return new Some(await this.brume_icon(script, request))
    if (request.method === "brume_run")
      return new Some(await this.brume_run(script, request))
    return new None()
  }

  async brume_icon(script: Port, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const res = await Result.runAndDoubleWrap(async () => {
        return await fetch("/favicon.png")
      }).then(r => r.throw(t))

      const blob = await Result.runAndDoubleWrap(async () => {
        return await res.blob()
      }).then(r => r.throw(t))

      const data = await Blobs.tryReadAsDataURL(blob).then(r => r.throw(t))

      return new Ok(data)
    })
  }

  async brume_run(script: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [subrequest, mouse] = (request as RpcRequestPreinit<[RpcRequestPreinit<unknown>, Mouse]>).params

      let session = await this.tryGetExtensionSession(script, mouse, false).then(r => r.throw(t))

      if (subrequest.method === "eth_accounts" && session == null)
        return new Ok([])
      if (subrequest.method === "eth_chainId" && session == null)
        return new Ok("0x1")
      if (subrequest.method === "eth_coinbase" && session == null)
        return new Ok(undefined)
      if (subrequest.method === "net_version" && session == null)
        return new Ok("1")

      if (subrequest.method === "wallet_requestPermissions" && session == null)
        session = await this.tryGetExtensionSession(script, mouse, true).then(r => r.throw(t))
      if (subrequest.method === "eth_requestAccounts" && session == null)
        session = await this.tryGetExtensionSession(script, mouse, true).then(r => r.throw(t))

      if (session == null)
        return new Err(new UnauthorizedError())

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const { wallets, chain } = session

      const wallet = Option.wrap(wallets[0]).ok().throw(t)
      const brume = await this.#tryGetOrTakeEthBrume(wallet.uuid).then(r => r.throw(t))
      const ethereum: BgEthereumContext = { chain, brume }

      if (subrequest.method === "eth_requestAccounts")
        return await this.eth_requestAccounts(ethereum, session, subrequest)
      if (subrequest.method === "eth_accounts")
        return await this.eth_accounts(ethereum, session, subrequest)
      if (subrequest.method === "eth_coinbase")
        return await this.eth_coinbase(ethereum, session, subrequest)
      if (subrequest.method === "eth_chainId")
        return await this.eth_chainId(ethereum, session, subrequest)
      if (subrequest.method === "net_version")
        return await this.net_version(ethereum, session, subrequest)
      if (subrequest.method === "wallet_requestPermissions")
        return await this.wallet_requestPermissions(ethereum, session, subrequest)
      if (subrequest.method === "wallet_getPermissions")
        return await this.wallet_getPermissions(ethereum, session, subrequest)
      if (subrequest.method === "eth_sendTransaction")
        return await this.eth_sendTransaction(ethereum, session, subrequest, mouse)
      if (subrequest.method === "personal_sign")
        return await this.personal_sign(ethereum, session, subrequest, mouse)
      if (subrequest.method === "eth_signTypedData_v4")
        return await this.eth_signTypedData_v4(ethereum, session, subrequest, mouse)
      if (subrequest.method === "wallet_switchEthereumChain")
        return await this.wallet_switchEthereumChain(ethereum, session, subrequest, mouse)

      const query = await this.tryRouteEthereum(ethereum, subrequest, storage).then(r => r.throw(t))

      /**
       * Ignore cooldown or store errors, only throw if the actual fetch failed
       */
      await query.tryFetch().then(r => r.inspectSync(r => r.throw(t)))

      const stored = core.storeds.get(query.cacheKey)
      const unstored = await core.tryUnstore<any, unknown, Error>(stored, { key: query.cacheKey }).then(r => r.throw(t))
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async eth_requestAccounts(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const addresses = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<string, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state.then(r => r.throw(t))
          const walletData = Option.wrap(walletState.data?.inner).ok().throw(t)

          return new Ok(walletData.address)
        })
      }))).throw(t)

      return new Ok(addresses)
    })
  }

  async eth_accounts(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const addresses = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<string, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state.then(r => r.throw(t))
          const walletData = Option.wrap(walletState.data?.inner).ok().throw(t)

          return new Ok(walletData.address)
        })
      }))).throw(t)

      return new Ok(addresses)
    })
  }

  async eth_coinbase(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<string>, Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const walletRef = session.wallets.at(0)

      if (walletRef == null)
        return new Ok(undefined)

      const walletQuery = Wallet.schema(walletRef.uuid, storage)
      const walletState = await walletQuery.state.then(r => r.throw(t))
      const walletData = Option.wrap(walletState.data?.inner).ok().throw(t)

      return new Ok(walletData.address)
    })
  }

  async eth_chainId(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    return new Ok(ZeroHexString.from(session.chain.chainId))
  }

  async net_version(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
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
    return await Result.unthrow(async t => {
      const [address, block] = (request as RpcRequestPreinit<[ZeroHexString, string]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const query = BgNativeToken.Balance.schema(ethereum, address, block, storage)

      /**
       * Ignore cooldown or store errors, only throw if the actual fetch failed
       */
      await query.tryFetch().then(r => r.inspectSync(r => r.throw(t)))

      const stored = core.storeds.get(query.cacheKey)
      const unstored = await core.tryUnstore<any, unknown, any>(stored, { key: query.cacheKey }).then(r => r.throw(t))
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async eth_sendTransaction(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse?: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [{ from, to, gas, value, data }] = (request as RpcRequestPreinit<[{
        from: string,
        to: string,
        gas: string,
        value: Nullable<string>,
        data: Nullable<string>
      }]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const wallets = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<WalletData, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state.then(r => r.throw(t))
          const walletData = Option.wrap(walletState.data?.inner).ok().throw(t)

          return new Ok(walletData)
        })
      }))).throw(t)

      /**
       * TODO: maybe ensure two wallets can't have the same address in the same session
       */
      const maybeWallet = wallets.find(wallet => Strings.equalsIgnoreCase(wallet.address, from))
      const walletId = Option.wrap(maybeWallet?.uuid).ok().throw(t)

      const chainId = ZeroHexString.from(ethereum.chain.chainId)

      const signature = await this.tryRequest<string>({
        id: crypto.randomUUID(),
        method: "eth_sendTransaction",
        params: { from, to, gas, value, data, walletId, chainId },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.throw(t).throw(t))

      return await tryEthereumFetch<string>(ethereum, {
        method: "eth_sendRawTransaction",
        params: [signature],
        noCheck: true
      }).then(r => r.throw(t))
    })
  }

  async personal_sign(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse?: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [message, address] = (request as RpcRequestPreinit<[string, string]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const wallets = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<WalletData, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state.then(r => r.throw(t))
          const walletData = Option.wrap(walletState.data?.inner).ok().throw(t)

          return new Ok(walletData)
        })
      }))).throw(t)

      /**
       * TODO: maybe ensure two wallets can't have the same address in the same session
       */
      const maybeWallet = wallets.find(wallet => Strings.equalsIgnoreCase(wallet.address, address))
      const walletId = Option.wrap(maybeWallet?.uuid).ok().throw(t)

      const chainId = ZeroHexString.from(ethereum.chain.chainId)

      const signature = await this.tryRequest<string>({
        id: crypto.randomUUID(),
        method: "personal_sign",
        params: { message, address, walletId, chainId },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.throw(t).throw(t))

      return new Ok(signature)
    })
  }

  async eth_signTypedData_v4(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse?: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [address, data] = (request as RpcRequestPreinit<[string, string]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const wallets = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<WalletData, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state.then(r => r.throw(t))
          const walletData = Option.wrap(walletState.data?.inner).ok().throw(t)

          return new Ok(walletData)
        })
      }))).throw(t)

      /**
       * TODO: maybe ensure two wallets can't have the same address in the same session
       */
      const maybeWallet = wallets.find(wallet => Strings.equalsIgnoreCase(wallet.address, address))
      const walletId = Option.wrap(maybeWallet?.uuid).ok().throw(t)

      const chainId = ZeroHexString.from(ethereum.chain.chainId)

      const signature = await this.tryRequest<string>({
        id: crypto.randomUUID(),
        method: "eth_signTypedData_v4",
        params: { data, address, walletId, chainId },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.throw(t).throw(t))

      return new Ok(signature)
    })
  }

  async wallet_switchEthereumChain(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [{ chainId }] = (request as RpcRequestPreinit<[{ chainId: string }]>).params

      const chain = Option.wrap(chainByChainId[parseInt(chainId, 16)]).ok().throw(t)

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const updatedSession = { ...session, chain }

      const sessionQuery = Session.schema(session.id, storage)
      await sessionQuery.tryMutate(Mutators.replaceData(updatedSession)).then(r => r.throw(t))

      for (const script of Option.wrap(this.scriptsBySession.get(session.id)).unwrapOr([])) {
        await script.tryRequest({
          method: "chainChanged",
          params: [ZeroHexString.from(chain.chainId)]
        }).then(r => r.throw(t).throw(t))

        await script.tryRequest({
          method: "networkChanged",
          params: [chain.chainId.toString()]
        }).then(r => r.throw(t).throw(t))
      }

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
    if (request.method === "brume_set_user")
      return new Some(await this.brume_set_user(request))
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

      const userQuery = User.schema(init.uuid, this.storage)
      await userQuery.tryMutate(Mutators.data(user)).then(r => r.throw(t))

      const usersQuery = Users.schema(this.storage)
      const usersState = await usersQuery.state.then(r => r.throw(t))
      const usersData = Option.wrap(usersState.data?.inner).ok().throw(t)

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

  async brume_getCurrentUser(request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<UserData>, Error>> {
    return await Result.unthrow(async t => {
      const userSession = this.#user

      if (userSession == null)
        return new Ok(undefined)

      const userQuery = User.schema(userSession.user.uuid, this.storage)
      const userState = await userQuery.state.then(r => r.throw(t))

      return new Ok(userState.current?.inner)
    })
  }

  async brume_disconnect(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [id] = (request as RpcRequestPreinit<[string]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const sessionQuery = Session.schema(id, storage)
      await sessionQuery.tryDelete().then(r => r.throw(t))

      const wcSession = this.wcBySession.get(id)

      if (wcSession != null) {
        await wcSession.tryClose(undefined).then(r => r.throw(t))
        this.wcBySession.delete(id)
      }

      for (const script of Option.wrap(this.scriptsBySession.get(id)).unwrapOr([])) {
        await script.tryRequest({
          method: "accountsChanged",
          params: [[]]
        }).then(r => r.throw(t).throw(t))

        this.sessionByScript.delete(script.name)
      }

      this.scriptsBySession.delete(id)

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
      const cipher = await crypter.tryEncrypt(plain, iv).then(r => r.throw(t))

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
      const plain = await crypter.tryDecrypt(cipher, iv).then(r => r.throw(t))

      const plainBase64 = Base64.get().tryEncodePadded(plain).throw(t)

      return new Ok(plainBase64)
    })
  }

  async brume_createSeed(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [seed] = (request as RpcRequestPreinit<[SeedData]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const seedQuery = Seed.Background.schema(seed.uuid, storage)
      await seedQuery.tryMutate(Mutators.data(seed)).then(r => r.throw(t))

      return Ok.void()
    })
  }

  async brume_createWallet(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [wallet] = (request as RpcRequestPreinit<[WalletData]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const walletQuery = Wallet.schema(wallet.uuid, storage)
      await walletQuery.tryMutate(Mutators.data(wallet)).then(r => r.throw(t))

      return Ok.void()
    })
  }

  async #tryGetOrTakeEthBrume(uuid: string): Promise<Result<EthBrume, Error>> {
    return await Result.unthrow(async t => {
      return await this.brumeByUuid.lock(async brumeByUuid => {
        const brume = brumeByUuid.get(uuid)

        if (brume == null) {
          const brumes = Option.wrap(this.#eths).ok().throw(t)
          const brume = await Pool.takeCryptoRandom(brumes).then(r => r.throw(t).result.inner.inner)
          brumeByUuid.set(uuid, brume)
          return new Ok(brume)
        }

        return new Ok(brume)
      })
    })
  }

  async brume_get_global(request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<RawState>, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcRequestPreinit<[string]>).params

      return await core.getOrCreateMutex(cacheKey).lock(async () => {
        const cached = core.storeds.get(cacheKey)

        if (cached != null)
          return new Ok(cached)

        const stored = await this.storage.tryGet(cacheKey).then(r => r.throw(t))
        core.storeds.set(cacheKey, stored)
        core.unstoreds.delete(cacheKey)
        await core.onState.emit(cacheKey, [])

        return new Ok(stored)
      })
    })
  }

  async brume_get_user(request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<RawState>, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcRequestPreinit<[string]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      return await core.getOrCreateMutex(cacheKey).lock(async () => {
        const cached = core.storeds.get(cacheKey)

        if (cached != null)
          return new Ok(cached)

        const stored = await storage.tryGet(cacheKey).then(r => r.throw(t))

        core.storeds.set(cacheKey, stored)
        core.unstoreds.delete(cacheKey)
        await core.onState.emit(cacheKey, [])

        return new Ok(stored)
      })
    })
  }

  async brume_set_user(request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey, rawState] = (request as RpcRequestPreinit<[string, Nullable<RawState>]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      storage.trySet(cacheKey, rawState).throw(t)
      core.storeds.set(cacheKey, rawState)
      core.unstoreds.delete(cacheKey)
      await core.onState.emit(cacheKey, [])

      return Ok.void()
    })
  }

  async brume_subscribe(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcRequestPreinit<[string]>).params

      const onState = async () => {
        const stored = core.storeds.get(cacheKey)

        await foreground.tryRequest({
          method: "brume_update",
          params: [cacheKey, stored]
        }).then(r => r.ignore())

        return new None()
      }

      core.onState.on(cacheKey, onState, { passive: true })

      foreground.events.on("close", () => {
        core.onState.off(cacheKey, onState)
        return new None()
      })

      return Ok.void()
    })
  }

  async tryRouteEthereum(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown> & EthereumFetchParams, storage: IDBStorage): Promise<Result<SimpleQuery<any, any, Error>, Error>> {
    if (request.method === BgNativeToken.Balance.method)
      return await BgNativeToken.Balance.tryParse(ethereum, request, storage)
    if (request.method === BgContractToken.Balance.method)
      return await BgContractToken.Balance.tryParse(ethereum, request, storage)
    if (request.method === BgPair.Price.method)
      return await BgPair.Price.tryParse(ethereum, request, storage)
    if (request.method === BgEns.Lookup.method)
      return await BgEns.Lookup.tryParse(ethereum, request, storage)
    if (request.method === BgEns.Reverse.method)
      return await BgEns.Reverse.tryParse(ethereum, request, storage)
    if (request.method === BgSignature.method)
      return await BgSignature.tryParse(ethereum, request, storage)

    if (request.method === "eth_getTransactionByHash")
      request.noCheck = true
    if (request.method === "eth_estimateGas")
      request.noCheck = true
    if (request.method === "web3_clientVersion")
      request.noCheck = true
    if (request.method === "eth_blockNumber")
      request.noCheck = true
    if (request.method === "eth_getTransactionReceipt")
      request.noCheck = true
    if (request.method === "eth_maxPriorityFeePerGas")
      request.noCheck = true

    return new Ok(BgUnknown.schema(ethereum, request, storage))
  }

  async brume_eth_index(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [uuid, chainId, subrequest] = (request as RpcRequestPreinit<[string, number, EthereumQueryKey<unknown>]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const chain = Option.wrap(chainByChainId[chainId]).ok().throw(t)

      const brume = await this.#tryGetOrTakeEthBrume(uuid).then(r => r.throw(t))

      const ethereum: BgEthereumContext = { chain, brume }

      const query = await this.tryRouteEthereum(ethereum, subrequest, storage).then(r => r.throw(t))

      await core.tryReindex(query.cacheKey, query.settings).then(r => r.throw(t))

      return Ok.void()
    })
  }

  async brume_eth_fetch(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [uuid, chainId, subrequest] = (request as RpcRequestPreinit<[string, number, EthereumQueryKey<unknown> & EthereumFetchParams]>).params

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const chain = Option.wrap(chainByChainId[chainId]).ok().throw(t)

      const brume = await this.#tryGetOrTakeEthBrume(uuid).then(r => r.throw(t))
      const ethereum: BgEthereumContext = { chain, brume }

      const query = await this.tryRouteEthereum(ethereum, subrequest, storage).then(r => r.throw(t))

      /**
       * Ignore cooldown or store errors, only throw if the actual fetch failed
       */
      await query.tryFetch().then(r => r.inspectSync(r => r.throw(t)))

      const stored = core.storeds.get(query.cacheKey)
      const unstored = await core.tryUnstore<any, unknown, Error>(stored, { key: query.cacheKey }).then(r => r.throw(t))
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async brume_log(request: RpcRequestInit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const logs = await BgSettings.Logs.schema(storage).state.then(r => r.throw(t))

      if (logs.real?.current?.inner !== true)
        return Ok.void()

      const circuit = await Pool.takeCryptoRandom(this.circuits).then(r => r.throw(t).result.get().inner)

      const body = JSON.stringify({ tor: true, method: "eth_getBalance" })
      await circuit.tryFetch("https://proxy.brume.money", { method: "POST", body }).then(r => r.inspectErrSync(() => console.warn(`Could not fetch logs`)).throw(t))
      await circuit.destroy()

      return Ok.void()
    })
  }

  async #tryWcReconnectAll(): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const persSessionsQuery = PersistentSessions.schema(storage)
      const persSessionsState = await persSessionsQuery.state.then(r => r.throw(t))

      for (const sessionRef of Option.wrap(persSessionsState?.data?.inner).unwrapOr([]))
        this.#tryWcResolveAndReconnect(sessionRef).catch(console.warn)

      return Ok.void()
    })
  }

  async #tryWcResolveAndReconnect(sessionRef: SessionRef): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      if (this.wcBySession.has(sessionRef.id))
        return Ok.void()

      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const sessionQuery = Session.schema(sessionRef.id, storage)
      const sessionState = await sessionQuery.state.then(r => r.throw(t))
      const sessionDataOpt = Option.wrap(sessionState.data?.inner)

      if (sessionDataOpt.isNone())
        return Ok.void()
      if (sessionDataOpt.inner.type !== "wc")
        return Ok.void()

      const sessionResult = await this.#tryWcReconnect(sessionDataOpt.inner)

      const { id } = sessionRef
      const error = sessionResult.mapErrSync(RpcError.rewrap).err().inner
      await Status.schema(id).tryMutate(Mutators.data<StatusData, never>({ id, error })).then(r => r.throw(t))

      return Ok.void()
    })
  }

  async #tryWcReconnect(sessionData: WcSessionData): Promise<Result<WcSession, Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.wrap(this.#user).ok().throw(t)

      const { topic, metadata, sessionKeyBase64, authKeyJwk, wallets, settlement } = sessionData
      const wallet = Option.wrap(wallets[0]).ok().throw(t)

      const authKey = await Ed25519.get().PrivateKey.tryImportJwk(authKeyJwk).then(r => r.throw(t))

      const brume = await WcBrume.tryCreate(this.circuits, authKey).then(r => r.throw(t))
      const irn = new IrnBrume(brume)

      const rawSessionKey = Base64.get().tryDecodePadded(sessionKeyBase64).throw(t).copyAndDispose()
      const sessionKey = Bytes.tryCast(rawSessionKey, 32).throw(t)
      const sessionClient = CryptoClient.tryNew(topic, sessionKey, irn).throw(t)
      const session = new WcSession(sessionClient, metadata)

      await irn.trySubscribe(topic).then(r => r.throw(t))

      /**
       * When settlement has been interrupted
       */
      if (settlement != null) {
        await session.client.tryWait<boolean>(settlement)
          .then(r => r.throw(t).throw(t))
          .then(Result.assert)
          .then(r => r.throw(t))

        const sessionQuery = Session.schema(sessionData.id, storage)
        await sessionQuery.tryMutate(Mutators.mapExistingData(d => d.mapSync(x => ({ ...x, settlement: undefined })))).then(r => r.throw(t))
      }

      const onRequest = async (suprequest: RpcRequestPreinit<unknown>) => {
        if (suprequest.method !== "wc_sessionRequest")
          return new None()
        const { chainId, request } = (suprequest as RpcRequestInit<WcSessionRequestParams>).params
        const chain = Option.wrap(chainByChainId[Number(chainId.split(":")[1])]).ok().throw(t)
        const brume = await this.#tryGetOrTakeEthBrume(wallet.uuid).then(r => r.throw(t))

        const ethereum: BgEthereumContext = { chain, brume }

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

      return new Ok(session)
    })
  }

  async brume_wc_connect(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<WcMetadata, Error>> {
    return await Result.unthrow(async t => {
      const [rawWcUrl, walletId] = (request as RpcRequestPreinit<[string, string]>).params

      const { user, storage } = Option.wrap(this.#user).ok().throw(t)

      const walletQuery = Wallet.schema(walletId, storage)
      const walletState = await walletQuery.state.then(r => r.throw(t))
      const wallet = Option.wrap(walletState.current?.inner).ok().throw(t)
      const chain = Option.wrap(chainByChainId[1]).ok().throw(t)

      const wcUrl = Url.tryParse(rawWcUrl).throw(t)
      const pairParams = await Wc.tryParse(wcUrl).then(r => r.throw(t))

      const brumes = Option.wrap(this.#wcs).ok().throw(t)
      const brume = await Pool.takeCryptoRandom(brumes).then(r => r.throw(t).result.inner.inner)
      const irn = new IrnBrume(brume)

      const [session, settlement] = await Wc.tryPair(irn, pairParams, wallet.address).then(r => r.throw(t))

      const originData: OriginData = {
        origin: `wc://${crypto.randomUUID()}`,
        title: session.metadata.name,
        description: session.metadata.description,
      }

      const originQuery = Origin.schema(originData.origin, storage)
      await originQuery.tryMutate(Mutators.data(originData)).then(r => r.throw(t))

      const authKeyJwk = await session.client.irn.brume.key.tryExportJwk().then(r => r.throw(t))
      const sessionKeyBase64 = Base64.get().tryEncodePadded(session.client.key).throw(t)

      const sessionData: WcSessionData = {
        type: "wc",
        id: crypto.randomUUID(),
        origin: originData.origin,
        metadata: session.metadata,
        persist: true,
        wallets: [WalletRef.from(wallet)],
        chain: chain,
        relay: Wc.RELAY,
        topic: session.client.topic,
        sessionKeyBase64: sessionKeyBase64,
        authKeyJwk: authKeyJwk,
        settlement: settlement.receipt
      }

      const sessionQuery = Session.schema(sessionData.id, storage)
      await sessionQuery.tryMutate(Mutators.data<SessionData, never>(sessionData)).then(r => r.throw(t))

      /**
       * Service worker can die here
       */
      await settlement.promise
        .then(r => r.throw(t).throw(t))
        .then(Result.assert)
        .then(r => r.throw(t))

      await sessionQuery.tryMutate(Mutators.mapExistingData(d => d.mapSync(x => ({ ...x, settlement: undefined })))).then(r => r.throw(t))

      const onRequest = async (suprequest: RpcRequestPreinit<unknown>) => {
        if (suprequest.method !== "wc_sessionRequest")
          return new None()
        const { chainId, request } = (suprequest as RpcRequestInit<WcSessionRequestParams>).params
        const chain = Option.wrap(chainByChainId[Number(chainId.split(":")[1])]).ok().throw(t)
        const brume = await this.#tryGetOrTakeEthBrume(wallet.uuid).then(r => r.throw(t))

        const ethereum: BgEthereumContext = { chain, brume }

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
      await Status.schema(id).tryMutate(Mutators.data<StatusData, never>({ id })).then(r => r.throw(t))

      const icons = session.metadata.icons.map<BlobbyRef>(x => ({ ref: true, id: x }))
      await originQuery.tryMutate(Mutators.mapExistingData(d => d.mapSync(x => ({ ...x, icons })))).then(r => r.throw(t))

      for (const iconUrl of session.metadata.icons) {
        Result.unthrow<Result<void, Error>>(async t => {
          const circuit = await Pool.takeCryptoRandom(this.circuits).then(r => r.throw(t).result.get().inner)

          console.debug(`Fetching ${iconUrl} with ${circuit.id}`)
          const iconRes = await circuit.tryFetch(iconUrl).then(r => r.throw(t))
          const iconBlob = await Result.runAndDoubleWrap(() => iconRes.blob()).then(r => r.throw(t))

          Result.assert(Mime.isImage(iconBlob.type)).throw(t)

          const iconData = await Blobs.tryReadAsDataURL(iconBlob).then(r => r.throw(t))

          const blobbyQuery = Blobby.schema(iconUrl, storage)
          const blobbyData = { id: iconUrl, data: iconData }
          await blobbyQuery.tryMutate(Mutators.data(blobbyData)).then(r => r.throw(t))

          return Ok.void()
        }).then(r => r.inspectErrSync(console.warn)).catch(console.error)
      }

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

      const gt = globalThis as any
      gt.Echalote = Echalote
      gt.Cadenas = Cadenas
      gt.Fleche = Fleche
      gt.Kcp = Kcp
      gt.Smux = Smux

      const fallbacks = await tryFetch<Fallback[]>(FALLBACKS_URL).then(r => r.throw(t))

      const tors = createTorPool(async () => {
        return await tryCreateTor({ fallbacks })
      }, { capacity: 1 })

      const storage = IDBStorage.tryCreate({ name: "memory" }).unwrap()
      const global = new Global(new Mutex(tors), storage)

      await global.tryInit().then(r => r.throw(t))

      return new Ok(global)
    })
  }).then(r => r.flatten())
}

const init = tryInit()

if (IS_WEBSITE) {

  const onSkipWaiting = (event: ExtendableMessageEvent) =>
    self.skipWaiting()

  const onHelloWorld = (event: ExtendableMessageEvent) => {
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

    port.tryRequest({ method: "brume_hello" }).then(r => r.ignore())
    port.runPingLoop()
  }

  self.addEventListener("message", (event) => {
    if (event.data === "SKIP_WAITING")
      return void onSkipWaiting(event)
    if (event.data === "HELLO_WORLD")
      return void onHelloWorld(event)
    throw Panic.from(new Error(`Invalid message`))
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