import "@hazae41/symbol-dispose-polyfill"

import { Blobs } from "@/libs/blobs/blobs"
import { BrowserError, browser } from "@/libs/browser/browser"
import { ExtensionPort, Port, WebsitePort } from "@/libs/channel/channel"
import { chainByChainId } from "@/libs/ethereum/mods/chain"
import { Mutators } from "@/libs/glacier/mutators"
import { Mime } from "@/libs/mime/mime"
import { Mouse } from "@/libs/mouse/mouse"
import { Strings } from "@/libs/strings/strings"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { createTorPool } from "@/libs/tor/tors/tors"
import { Url, qurl } from "@/libs/url/url"
import { CryptoClient } from "@/libs/wconn/mods/crypto/client"
import { IrnBrume } from "@/libs/wconn/mods/irn/irn"
import { Wc, WcMetadata, WcSession, WcSessionRequestParams } from "@/libs/wconn/mods/wc/wc"
import { UnauthorizedError } from "@/mods/foreground/errors/errors"
import { Base16 } from "@hazae41/base16"
import { Base58 } from "@hazae41/base58"
import { Base64 } from "@hazae41/base64"
import { Base64Url } from "@hazae41/base64url"
import { Bytes } from "@hazae41/bytes"
import { Cadenas } from "@hazae41/cadenas"
import { ChaCha20Poly1305 } from "@hazae41/chacha20poly1305"
import { ZeroHexString } from "@hazae41/cubane"
import { Circuit, Consensus, Echalote, TorClientDuplex } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Fleche, fetch } from "@hazae41/fleche"
import { Future } from "@hazae41/future"
import { IDBStorage, RawState, SimpleQuery, State, core } from "@hazae41/glacier"
import { RpcError, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { Kcp } from "@hazae41/kcp"
import { Keccak256 } from "@hazae41/keccak256"
import { Mutex } from "@hazae41/mutex"
import { None, Nullable, Option, Some } from "@hazae41/option"
import { Pool } from "@hazae41/piscine"
import { SuperEventTarget } from "@hazae41/plume"
import { Err, Ok, Panic, Result } from "@hazae41/result"
import { Ripemd160 } from "@hazae41/ripemd160"
import { Sha1 } from "@hazae41/sha1"
import { Smux } from "@hazae41/smux"
import { X25519 } from "@hazae41/x25519"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { BgBlobby, BlobbyRef } from "./entities/blobbys/data"
import { EthBrume, WcBrume } from "./entities/brumes/data"
import { BgOrigin, OriginData, PreOriginData } from "./entities/origins/data"
import { AppRequest, AppRequestData, BgAppRequest } from "./entities/requests/data"
import { BgSeed, SeedData } from "./entities/seeds/data"
import { PersistentSessions } from "./entities/sessions/all/data"
import { BgSession, ExSessionData, SessionData, SessionRef, WcSessionData } from "./entities/sessions/data"
import { Status, StatusData } from "./entities/sessions/status/data"
import { BgSettings } from "./entities/settings/data"
import { BgSignature } from "./entities/signatures/data"
import { BgContractToken, BgNativeToken } from "./entities/tokens/data"
import { BgUnknown } from "./entities/unknown/data"
import { Users } from "./entities/users/all/data"
import { User, UserData, UserInit, UserSession, getCurrentUser } from "./entities/users/data"
import { BgEns, BgEthereumContext, BgPair, EthereumContext, EthereumFetchParams, EthereumQueryKey, Wallet, WalletData, WalletRef } from "./entities/wallets/data"
import { createUserStorageOrThrow } from "./storage"

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

  readonly circuits: Mutex<Pool<Circuit>>

  #wcs?: Mutex<Pool<WcBrume>>
  #eths?: Mutex<Pool<EthBrume>>

  readonly brumeByUuid = new Mutex(new Map<string, EthBrume>())

  readonly scriptsBySession = new Map<string, Set<Port>>()

  readonly sessionByScript = new Map<string, Mutex<Slot<string>>>()

  readonly wcBySession = new Map<string, WcSession>()

  /**
   * Current popup
   */
  readonly popup = new Mutex<Slot<PopupData>>({})

  constructor(
    readonly consensus: Consensus,
    readonly tors: Pool<TorClientDuplex>,
    readonly storage: IDBStorage
  ) {
    this.circuits = new Mutex(Circuits.pool(this.tors, consensus, { capacity: 9 }))

    core.onState.on(BgAppRequest.All.key, async () => {
      const state = core.getStateSync(BgAppRequest.All.key) as State<AppRequest[], never>

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

  async getStoredPasswordOrThrow(): Promise<PasswordData> {
    if (IS_FIREFOX_EXTENSION) {
      const uuid = sessionStorage.getItem("uuid") ?? undefined
      const password = sessionStorage.getItem("password") ?? undefined

      return { uuid, password }
    }

    return await BrowserError.runOrThrow(() => browser.storage.session.get(["uuid", "password"]))
  }

  async setStoredPasswordOrThrow(uuid: string, password: string) {
    if (IS_FIREFOX_EXTENSION) {
      sessionStorage.setItem("uuid", uuid)
      sessionStorage.setItem("password", password)

      return
    }

    await BrowserError.runOrThrow(() => browser.storage.session.set({ uuid, password }))
  }

  async initOrThrow(): Promise<void> {
    if (IS_EXTENSION) {
      const { uuid, password } = await this.getStoredPasswordOrThrow()
      await this.setCurrentUserOrThrow(uuid, password)
    }
  }

  async setCurrentUserOrThrow(uuid: Nullable<string>, password: Nullable<string>): Promise<Nullable<UserSession>> {
    if (uuid == null)
      return undefined
    if (password == null)
      return undefined

    const userQuery = User.schema(uuid, this.storage)
    const userState = await userQuery.state
    const userData = Option.unwrap(userState.current?.get())

    const user: User = { ref: true, uuid: userData.uuid }

    const { storage, hasher, crypter } = await createUserStorageOrThrow(userData, password)

    const currentUserQuery = getCurrentUser()
    await currentUserQuery.mutate(Mutators.data<User, never>(user))

    const userSession: UserSession = { user, storage, hasher, crypter }

    this.#user = userSession

    await this.#wcReconnectAllOrThrow()

    this.#wcs = new Mutex(WcBrume.createPool(this.circuits, { capacity: 1 }))
    this.#eths = new Mutex(EthBrume.createPool(this.circuits, chainByChainId, { capacity: 1 }))

    return userSession
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
          const windowId = Option.unwrap(slot.current.window.id)
          const tabId = Option.unwrap(slot.current.window.tabs?.[0].id)

          const url = force ? `popup.html#${pathname}` : undefined

          await BrowserError.tryRun(async () => {
            return await browser.tabs.update(tabId, { url, highlighted: true })
          }).then(r => r.unwrap())

          await BrowserError.tryRun(async () => {
            return await browser.windows.update(windowId, { focused: true })
          }).then(r => r.unwrap())

          return new Ok(slot.current)
        }

        const height = 630
        const width = 400

        const top = Math.max(mouse.y - (height / 2), 0)
        const left = Math.max(mouse.x - (width / 2), 0)

        const window = await BrowserError.tryRun(async () => {
          return await browser.windows.create({ type: "popup", url: `popup.html#${pathname}`, state: "normal", height, width, top, left })
        }).then(r => r.unwrap())

        const channel = await this.tryWaitPopupHello(window).then(r => r.unwrap())

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
      await requestQuery.mutate(Mutators.data<AppRequestData, never>(request))

      const done = new Future<Result<void, Error>>()

      try {
        return await this.tryWaitResponse(request.id, done)
      } finally {
        await requestQuery.delete()
        done.resolve(Ok.void())
      }
    })
  }

  async tryRequestPopup<T>(request: AppRequestData, mouse: Mouse, force?: boolean): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
      const requestQuery = BgAppRequest.schema(request.id)
      await requestQuery.mutate(Mutators.data<AppRequestData, never>(request))

      const done = new Future<Result<void, Error>>()

      try {
        const { id, method, params } = request
        const url = qurl(`/${method}?id=${id}`, params)

        const popup = await this.tryOpenOrFocusPopup(url, mouse, force).then(r => r.unwrap())
        const response = await this.tryWaitPopupResponse<T>(request.id, popup, done).then(r => r.unwrap())

        return new Ok(response)
      } finally {
        await requestQuery.delete()
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
          const { storage } = Option.unwrap(this.#user)

          const sessionQuery = BgSession.schema(currentSession, storage)
          const sessionState = await sessionQuery.state
          const sessionData = Option.unwrap(sessionState.data?.inner)

          return new Ok(sessionData)
        }

        const preOriginData = await script.tryRequest<PreOriginData>({
          method: "brume_origin"
        }).then(r => r.unwrap().unwrap())

        if (this.#user == null && !force)
          return new Ok(undefined)

        if (this.#user == null && force)
          await this.tryOpenOrFocusPopup("/", mouse).then(r => r.unwrap())

        const { storage } = Option.unwrap(this.#user)

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
          const sessionId = sessionByOriginState.data.inner.id

          const sessionQuery = BgSession.schema(sessionId, storage)
          const sessionState = await sessionQuery.state
          const sessionData = Option.unwrap(sessionState.data?.inner)

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

          const { chainId } = sessionData.chain

          if (chainId !== 1) {
            await script.tryRequest<void>({
              method: "chainChanged",
              params: [ZeroHexString.from(chainId)]
            }).then(r => r.unwrap().unwrap())

            await script.tryRequest({
              method: "networkChanged",
              params: [chainId.toString()]
            }).then(r => r.unwrap().unwrap())
          }

          {
            const addresses = Result.all(await Promise.all(sessionData.wallets.map(async wallet => {
              return await Result.unthrow<Result<string, Error>>(async t => {
                const walletQuery = Wallet.schema(wallet.uuid, storage)
                const walletState = await walletQuery.state
                const walletData = Option.unwrap(walletState.data?.inner)

                return new Ok(walletData.address)
              })
            }))).unwrap()

            await script.tryRequest({
              method: "accountsChanged",
              params: [addresses]
            }).then(r => r.unwrap().unwrap())
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
        }, mouse, true).then(r => r.unwrap().unwrap())

        const chain = Option.unwrap(chainByChainId[chainId])

        const sessionData: ExSessionData = {
          type: "ex",
          id: crypto.randomUUID(),
          origin: origin,
          persist: persistent,
          wallets: wallets.map(wallet => WalletRef.from(wallet)),
          chain: chain
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

        if (chainId !== 1) {
          await script.tryRequest<void>({
            method: "chainChanged",
            params: [ZeroHexString.from(chainId)]
          }).then(r => r.unwrap().unwrap())

          await script.tryRequest({
            method: "networkChanged",
            params: [chainId.toString()]
          }).then(r => r.unwrap().unwrap())
        }

        {
          const addresses = Result.all(await Promise.all(sessionData.wallets.map(async wallet => {
            return await Result.unthrow<Result<string, Error>>(async t => {
              const walletQuery = Wallet.schema(wallet.uuid, storage)
              const walletState = await walletQuery.state
              const walletData = Option.unwrap(walletState.data?.inner)

              return new Ok(walletData.address)
            })
          }))).unwrap()

          await script.tryRequest({
            method: "accountsChanged",
            params: [addresses]
          }).then(r => r.unwrap().unwrap())
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
        return await globalThis.fetch("/favicon.png")
      }).then(r => r.unwrap())

      const blob = await Result.runAndDoubleWrap(async () => {
        return await res.blob()
      }).then(r => r.unwrap())

      const data = await Blobs.tryReadAsDataURL(blob).then(r => r.unwrap())

      return new Ok(data)
    })
  }

  async brume_run(script: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [subrequest, mouse] = (request as RpcRequestPreinit<[RpcRequestPreinit<unknown>, Mouse]>).params

      let session = await this.tryGetExtensionSession(script, mouse, false).then(r => r.unwrap())

      if (subrequest.method === "eth_accounts" && session == null)
        return new Ok([])
      if (subrequest.method === "eth_chainId" && session == null)
        return new Ok("0x1")
      if (subrequest.method === "eth_coinbase" && session == null)
        return new Ok(undefined)
      if (subrequest.method === "net_version" && session == null)
        return new Ok("1")

      if (subrequest.method === "wallet_requestPermissions" && session == null)
        session = await this.tryGetExtensionSession(script, mouse, true).then(r => r.unwrap())
      if (subrequest.method === "eth_requestAccounts" && session == null)
        session = await this.tryGetExtensionSession(script, mouse, true).then(r => r.unwrap())

      if (session == null)
        return new Err(new UnauthorizedError())

      const { storage } = Option.unwrap(this.#user)

      const { wallets, chain } = session

      const wallet = Option.unwrap(wallets[0])
      const brume = await this.#tryGetOrTakeEthBrume(wallet.uuid).then(r => r.unwrap())
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

      const query = await this.tryRouteEthereum(ethereum, subrequest, storage).then(r => r.unwrap())

      try { await query.fetch() } catch { }

      const stored = core.storeds.get(query.cacheKey)
      const unstored = await core.unstoreOrThrow<any, unknown, Error>(stored, { key: query.cacheKey })
      return Option.unwrap(unstored.current)
    })
  }

  async eth_requestAccounts(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.unwrap(this.#user)

      const addresses = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<string, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state
          const walletData = Option.unwrap(walletState.data?.inner)

          return new Ok(walletData.address)
        })
      }))).unwrap()

      return new Ok(addresses)
    })
  }

  async eth_accounts(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<string[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.unwrap(this.#user)

      const addresses = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<string, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state
          const walletData = Option.unwrap(walletState.data?.inner)

          return new Ok(walletData.address)
        })
      }))).unwrap()

      return new Ok(addresses)
    })
  }

  async eth_coinbase(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<string>, Error>> {
    return await Result.unthrow(async t => {
      const { storage } = Option.unwrap(this.#user)

      const walletRef = session.wallets.at(0)

      if (walletRef == null)
        return new Ok(undefined)

      const walletQuery = Wallet.schema(walletRef.uuid, storage)
      const walletState = await walletQuery.state
      const walletData = Option.unwrap(walletState.data?.inner)

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

      const { storage } = Option.unwrap(this.#user)

      const query = BgNativeToken.Balance.schema(ethereum, address, block, storage)

      try { await query.fetch() } catch { }

      const stored = core.storeds.get(query.cacheKey)
      const unstored = await core.unstoreOrThrow<any, unknown, any>(stored, { key: query.cacheKey })
      const fetched = Option.unwrap(unstored.current)

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

      const { storage } = Option.unwrap(this.#user)

      const wallets = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<WalletData, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state
          const walletData = Option.unwrap(walletState.data?.inner)

          return new Ok(walletData)
        })
      }))).unwrap()

      /**
       * TODO: maybe ensure two wallets can't have the same address in the same session
       */
      const maybeWallet = wallets.find(wallet => Strings.equalsIgnoreCase(wallet.address, from))
      const walletId = Option.unwrap(maybeWallet?.uuid)

      const chainId = ZeroHexString.from(ethereum.chain.chainId)

      const signature = await this.tryRequest<string>({
        id: crypto.randomUUID(),
        method: "eth_sendTransaction",
        params: { from, to, gas, value, data, walletId, chainId },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.unwrap().unwrap())

      return await EthereumContext.fetchOrFail<string>(ethereum, {
        method: "eth_sendRawTransaction",
        params: [signature],
        noCheck: true
      }, {})
    })
  }

  async personal_sign(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse?: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [message, address] = (request as RpcRequestPreinit<[string, string]>).params

      const { storage } = Option.unwrap(this.#user)

      const wallets = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<WalletData, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state
          const walletData = Option.unwrap(walletState.data?.inner)

          return new Ok(walletData)
        })
      }))).unwrap()

      /**
       * TODO: maybe ensure two wallets can't have the same address in the same session
       */
      const maybeWallet = wallets.find(wallet => Strings.equalsIgnoreCase(wallet.address, address))
      const walletId = Option.unwrap(maybeWallet?.uuid)

      const chainId = ZeroHexString.from(ethereum.chain.chainId)

      const signature = await this.tryRequest<string>({
        id: crypto.randomUUID(),
        method: "personal_sign",
        params: { message, address, walletId, chainId },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.unwrap().unwrap())

      return new Ok(signature)
    })
  }

  async eth_signTypedData_v4(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse?: Mouse): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [address, data] = (request as RpcRequestPreinit<[string, string]>).params

      const { storage } = Option.unwrap(this.#user)

      const wallets = Result.all(await Promise.all(session.wallets.map(async wallet => {
        return await Result.unthrow<Result<WalletData, Error>>(async t => {
          const walletQuery = Wallet.schema(wallet.uuid, storage)
          const walletState = await walletQuery.state
          const walletData = Option.unwrap(walletState.data?.inner)

          return new Ok(walletData)
        })
      }))).unwrap()

      /**
       * TODO: maybe ensure two wallets can't have the same address in the same session
       */
      const maybeWallet = wallets.find(wallet => Strings.equalsIgnoreCase(wallet.address, address))
      const walletId = Option.unwrap(maybeWallet?.uuid)

      const chainId = ZeroHexString.from(ethereum.chain.chainId)

      const signature = await this.tryRequest<string>({
        id: crypto.randomUUID(),
        method: "eth_signTypedData_v4",
        params: { data, address, walletId, chainId },
        origin: session.origin,
        session: session.id
      }, mouse).then(r => r.unwrap().unwrap())

      return new Ok(signature)
    })
  }

  async wallet_switchEthereumChain(ethereum: BgEthereumContext, session: SessionData, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [{ chainId }] = (request as RpcRequestPreinit<[{ chainId: string }]>).params

      const chain = Option.unwrap(chainByChainId[parseInt(chainId, 16)])

      const { storage } = Option.unwrap(this.#user)

      const updatedSession = { ...session, chain }

      const sessionQuery = BgSession.schema(session.id, storage)
      await sessionQuery.mutate(Mutators.replaceData(updatedSession))

      for (const script of Option.wrap(this.scriptsBySession.get(session.id)).unwrapOr([])) {
        await script.tryRequest({
          method: "chainChanged",
          params: [ZeroHexString.from(chain.chainId)]
        }).then(r => r.unwrap().unwrap())

        await script.tryRequest({
          method: "networkChanged",
          params: [chain.chainId.toString()]
        }).then(r => r.unwrap().unwrap())
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

      const user = await User.tryCreate(init).then(r => r.unwrap())

      const userQuery = User.schema(init.uuid, this.storage)
      await userQuery.mutate(Mutators.data(user))

      const usersQuery = Users.schema(this.storage)
      const usersState = await usersQuery.state
      const usersData = Option.unwrap(usersState.data?.inner)

      return new Ok(usersData)
    })
  }

  async brume_login(request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [uuid, password] = (request as RpcRequestPreinit<[string, string]>).params

      await this.setCurrentUserOrThrow(uuid, password)

      if (IS_EXTENSION) {
        await this.setStoredPasswordOrThrow(uuid, password)
        return Ok.void()
      }

      return Ok.void()
    })
  }

  async brume_getCurrentUser(request: RpcRequestPreinit<unknown>): Promise<Result<Nullable<UserData>, Error>> {
    return await Result.unthrow(async t => {
      const userSession = this.#user

      if (userSession == null)
        return new Ok(undefined)

      const userQuery = User.schema(userSession.user.uuid, this.storage)
      const userState = await userQuery.state

      return new Ok(userState.current?.inner)
    })
  }

  async brume_disconnect(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
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
        await script.tryRequest({
          method: "accountsChanged",
          params: [[]]
        }).then(r => r.unwrap().unwrap())

        this.sessionByScript.delete(script.name)
      }

      this.scriptsBySession.delete(id)

      return Ok.void()
    })
  }

  async brume_open(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [pathname] = (request as RpcRequestPreinit<[string]>).params

      await BrowserError.tryRun(async () => {
        return await browser.tabs.create({ url: `index.html#${pathname}` })
      }).then(r => r.unwrap())

      return Ok.void()
    })
  }

  async brume_encrypt(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<[string, string], Error>> {
    return await Result.unthrow(async t => {
      const [plainBase64] = (request as RpcRequestPreinit<[string]>).params

      const { crypter } = Option.unwrap(this.#user)

      const plain = Base64.get().tryDecodePadded(plainBase64).unwrap().copyAndDispose()
      const iv = Bytes.random(16)
      const cipher = await crypter.encryptOrThrow(plain, iv)

      const ivBase64 = Base64.get().tryEncodePadded(iv).unwrap()
      const cipherBase64 = Base64.get().tryEncodePadded(cipher).unwrap()

      return new Ok([ivBase64, cipherBase64])
    })
  }

  async brume_decrypt(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const [ivBase64, cipherBase64] = (request as RpcRequestPreinit<[string, string]>).params

      const { crypter } = Option.unwrap(this.#user)

      const iv = Base64.get().tryDecodePadded(ivBase64).unwrap().copyAndDispose()
      const cipher = Base64.get().tryDecodePadded(cipherBase64).unwrap().copyAndDispose()
      const plain = await crypter.decryptOrThrow(cipher, iv)

      const plainBase64 = Base64.get().tryEncodePadded(plain).unwrap()

      return new Ok(plainBase64)
    })
  }

  async brume_createSeed(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [seed] = (request as RpcRequestPreinit<[SeedData]>).params

      const { storage } = Option.unwrap(this.#user)

      const seedQuery = BgSeed.Background.schema(seed.uuid, storage)
      await seedQuery.mutate(Mutators.data(seed))

      return Ok.void()
    })
  }

  async brume_createWallet(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [wallet] = (request as RpcRequestPreinit<[WalletData]>).params

      const { storage } = Option.unwrap(this.#user)

      const walletQuery = Wallet.schema(wallet.uuid, storage)
      await walletQuery.mutate(Mutators.data(wallet))

      return Ok.void()
    })
  }

  async #tryGetOrTakeEthBrume(uuid: string): Promise<Result<EthBrume, Error>> {
    return await Result.unthrow(async t => {
      return await this.brumeByUuid.lock(async brumeByUuid => {
        const brume = brumeByUuid.get(uuid)

        if (brume == null) {
          const brumes = Option.unwrap(this.#eths)
          const brume = await Pool.tryTakeCryptoRandom(brumes).then(r => r.unwrap().unwrap().inner.inner)
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

        const stored = await this.storage.getOrThrow(cacheKey)
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

      const { storage } = Option.unwrap(this.#user)

      return await core.getOrCreateMutex(cacheKey).lock(async () => {
        const cached = core.storeds.get(cacheKey)

        if (cached != null)
          return new Ok(cached)

        const stored = await storage.getOrThrow(cacheKey)

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

      const { storage } = Option.unwrap(this.#user)

      storage.setOrThrow(cacheKey, rawState)
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
    if (request.method === "eth_getBlockByNumber")
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

      const { storage } = Option.unwrap(this.#user)

      const chain = Option.unwrap(chainByChainId[chainId])

      const brume = await this.#tryGetOrTakeEthBrume(uuid).then(r => r.unwrap())

      const ethereum: BgEthereumContext = { chain, brume }

      const query = await this.tryRouteEthereum(ethereum, subrequest, storage).then(r => r.unwrap())

      await core.reindexOrThrow(query.cacheKey, query.settings)

      return Ok.void()
    })
  }

  async brume_eth_fetch(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [uuid, chainId, subrequest] = (request as RpcRequestPreinit<[string, number, EthereumQueryKey<unknown> & EthereumFetchParams]>).params

      const { storage } = Option.unwrap(this.#user)

      const chain = Option.unwrap(chainByChainId[chainId])

      const brume = await this.#tryGetOrTakeEthBrume(uuid).then(r => r.unwrap())
      const ethereum: BgEthereumContext = { chain, brume }

      const query = await this.tryRouteEthereum(ethereum, subrequest, storage).then(r => r.unwrap())

      try { await query.fetch() } catch { }

      const stored = core.storeds.get(query.cacheKey)
      const unstored = await core.unstoreOrThrow<any, unknown, Error>(stored, { key: query.cacheKey })

      return Option.unwrap(unstored.current)
    })
  }

  async brume_log(request: RpcRequestInit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      const { storage } = Option.unwrap(this.#user)

      const logs = await BgSettings.Logs.schema(storage).state

      if (logs.real?.current?.inner !== true)
        return Ok.void()

      using circuit = await Pool.tryTakeCryptoRandom(this.circuits).then(r => r.unwrap().unwrap().inner.inner)

      const body = JSON.stringify({ tor: true, method: "eth_getBalance" })

      using stream = await Circuits.openAsOrThrow(circuit, "https://proxy.brume.money")
      await fetch("https://proxy.brume.money", { method: "POST", body, stream: stream.inner })

      return Ok.void()
    })
  }

  async #wcReconnectAllOrThrow(): Promise<void> {
    const { storage } = Option.unwrap(this.#user)

    const persSessionsQuery = PersistentSessions.schema(storage)
    const persSessionsState = await persSessionsQuery.state

    for (const sessionRef of Option.wrap(persSessionsState?.data?.inner).unwrapOr([]))
      this.#wcResolveAndReconnectOrThrow(sessionRef).catch(console.warn)

    return
  }

  async #wcResolveAndReconnectOrThrow(sessionRef: SessionRef): Promise<void> {
    if (this.wcBySession.has(sessionRef.id))
      return

    const { storage } = Option.unwrap(this.#user)

    const sessionQuery = BgSession.schema(sessionRef.id, storage)
    const sessionState = await sessionQuery.state
    const sessionDataOpt = Option.wrap(sessionState.data?.inner)

    if (sessionDataOpt.isNone())
      return
    if (sessionDataOpt.inner.type !== "wc")
      return

    const sessionResult = await this.#tryWcReconnectOrThrow(sessionDataOpt.inner)

    const { id } = sessionRef
    const error = sessionResult.mapErrSync(RpcError.rewrap).err().inner
    await Status.schema(id).mutate(Mutators.data<StatusData, never>({ id, error }))
  }

  async #tryWcReconnectOrThrow(sessionData: WcSessionData): Promise<Result<WcSession, Error>> {
    return await Result.runAndDoubleWrap(() => this.#wcReconnectOrThrow(sessionData))
  }

  async #wcReconnectOrThrow(sessionData: WcSessionData): Promise<WcSession> {
    const { storage } = Option.unwrap(this.#user)

    const { topic, metadata, sessionKeyBase64, authKeyJwk, wallets, settlement } = sessionData
    const wallet = Option.unwrap(wallets[0])

    const authKey = await Ed25519.get().PrivateKey.importJwkOrThrow(authKeyJwk)

    const brume = await WcBrume.tryCreate(this.circuits, authKey).then(r => r.unwrap())
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
      const chain = Option.unwrap(chainByChainId[Number(chainId.split(":")[1])])
      const brume = await this.#tryGetOrTakeEthBrume(wallet.uuid).then(r => r.unwrap())

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

    return session
  }

  async brume_wc_connect(foreground: Port, request: RpcRequestPreinit<unknown>): Promise<Result<WcMetadata, Error>> {
    return await Result.unthrow(async t => {
      const [rawWcUrl, walletId] = (request as RpcRequestPreinit<[string, string]>).params

      const { user, storage } = Option.unwrap(this.#user)

      const walletQuery = Wallet.schema(walletId, storage)
      const walletState = await walletQuery.state
      const wallet = Option.unwrap(walletState.current?.inner)
      const chain = Option.unwrap(chainByChainId[1])

      const wcUrl = Url.tryParse(rawWcUrl).unwrap()
      const pairParams = await Wc.tryParse(wcUrl).then(r => r.unwrap())

      const brumes = Option.unwrap(this.#wcs)
      const brume = await Pool.tryTakeCryptoRandom(brumes).then(r => r.unwrap().unwrap().inner.inner)
      const irn = new IrnBrume(brume)

      const [session, settlement] = await Wc.tryPair(irn, pairParams, wallet.address).then(r => r.unwrap())

      const originData: OriginData = {
        origin: `wc://${crypto.randomUUID()}`,
        title: session.metadata.name,
        description: session.metadata.description,
      }

      const originQuery = BgOrigin.schema(originData.origin, storage)
      await originQuery.mutate(Mutators.data(originData))

      const authKeyJwk = await session.client.irn.brume.key.tryExportJwk().then(r => r.unwrap())
      const sessionKeyBase64 = Base64.get().tryEncodePadded(session.client.key).unwrap()

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
        const chain = Option.unwrap(chainByChainId[Number(chainId.split(":")[1])])
        const brume = await this.#tryGetOrTakeEthBrume(wallet.uuid).then(r => r.unwrap())

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
      await Status.schema(id).mutate(Mutators.data<StatusData, never>({ id }))

      const icons = session.metadata.icons.map<BlobbyRef>(x => ({ ref: true, id: x }))
      await originQuery.mutate(Mutators.mapExistingData(d => d.mapSync(x => ({ ...x, icons }))))

      for (const iconUrl of session.metadata.icons) {
        Result.unthrow<Result<void, Error>>(async t => {
          using circuit = await Pool.tryTakeCryptoRandom(this.circuits).then(r => r.unwrap().unwrap().inner.inner)

          console.debug(`Fetching ${iconUrl} with ${circuit.id}`)
          using stream = await Circuits.openAsOrThrow(circuit, iconUrl)
          const iconRes = await fetch(iconUrl, { stream: stream.inner })
          const iconBlob = await Result.runAndDoubleWrap(() => iconRes.blob()).then(r => r.unwrap())

          Result.assert(Mime.isImage(iconBlob.type)).unwrap()

          const iconData = await Blobs.tryReadAsDataURL(iconBlob).then(r => r.unwrap())

          const blobbyQuery = BgBlobby.schema(iconUrl, storage)
          const blobbyData = { id: iconUrl, data: iconData }
          await blobbyQuery.mutate(Mutators.data(blobbyData))

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

async function initOrThrow() {
  await Promise.all([initBerith(), initMorax(), initAlocer(), initZepar()])

  const gt = globalThis as any
  gt.Echalote = Echalote
  gt.Cadenas = Cadenas
  gt.Fleche = Fleche
  gt.Kcp = Kcp
  gt.Smux = Smux

  const tors = createTorPool({ capacity: 1 })

  const tor = await tors.tryGetCryptoRandom().then(r => r.unwrap().unwrap().inner.inner)

  using circuit = await tor.createOrThrow(AbortSignal.timeout(5000))
  const consensus = await Consensus.fetchOrThrow(circuit)

  const storage = IDBStorage.createOrThrow({ name: "memory" })
  const global = new Global(consensus, tors, storage)

  await global.initOrThrow()

  return global
}

const init = Result.runAndDoubleWrap(() => initOrThrow())

if (IS_WEBSITE) {

  const onSkipWaiting = (event: ExtendableMessageEvent) =>
    self.skipWaiting()

  const onHelloWorld = (event: ExtendableMessageEvent) => {
    const raw = event.ports[0]

    const router = new WebsitePort("foreground", raw)

    const onRequest = async (request: RpcRequestInit<unknown>) => {
      const inited = await init

      if (inited.isErr())
        return new Some(inited)

      return await inited.get().tryRouteForeground(router, request)
    }

    router.events.on("request", onRequest, { passive: true })

    const onClose = () => {
      using _ = router

      router.events.off("request", onRequest)
      router.port.close()

      return new None()
    }

    router.events.on("close", onClose, { passive: true })

    raw.start()

    router.tryRequest({ method: "brume_hello" }).then(r => r.ignore())
    router.runPingLoop()
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