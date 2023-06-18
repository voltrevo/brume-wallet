import { browser, tryBrowser, tryBrowserSync } from "@/libs/browser/browser"
import { chains } from "@/libs/ethereum/chain"
import { Mouse } from "@/libs/mouse/mouse"
import { RpcParamfulRequestInit, RpcParamfulRequestPreinit, RpcRequestInit, RpcRequestPreinit, RpcResponse } from "@/libs/rpc"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { createTorPool, tryCreateTor } from "@/libs/tor/tors/tors"
import { Mutators } from "@/libs/xswr/mutators"
import { Berith } from "@hazae41/berith"
import { Bytes } from "@hazae41/bytes"
import { Circuit, Fallback, TorClientDuplex } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Future } from "@hazae41/future"
import { Morax } from "@hazae41/morax"
import { Mutex } from "@hazae41/mutex"
import { NoneError, Option, Optional } from "@hazae41/option"
import { Cancel, Looped, Pool, Retry, tryLoop } from "@hazae41/piscine"
import { Catched, Err, Ok, Panic, Result } from "@hazae41/result"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
import { Core, IDBStorage, Makeable, RawState } from "@hazae41/xswr"
import { ethers } from "ethers"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { EthereumBrume, EthereumBrumes, EthereumSocket, getEthereumBrumes } from "./entities/sessions/data"
import { getUsers } from "./entities/users/all/data"
import { User, UserData, UserInit, UserSession, getCurrentUser, getUser, tryCreateUser } from "./entities/users/data"
import { getWallets } from "./entities/wallets/all/data"
import { EthereumPrivateKeyWallet, EthereumSession, EthereumSessionAndBrumes, Wallet, WalletData, getEthereumBalance, getEthereumSession, getEthereumUnknown, getWallet } from "./entities/wallets/data"
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

export class Global {

  readonly core = new Core({})

  constructor(
    readonly tors: Mutex<Pool<TorClientDuplex, Error>>,
    readonly circuits: Mutex<Pool<Circuit, Error>>,
    readonly brumes: Mutex<Pool<EthereumBrume, Error>>,
    readonly storage: IDBStorage
  ) { }

  async make<T>(makeable: Makeable<T>) {
    return await makeable.make(this.core)
  }

  async tryGetCurrentUser(): Promise<Result<UserSession, NoneError>> {
    const currentUserQuery = await this.make(getCurrentUser())
    return Option.wrap(currentUserQuery.current?.inner).ok()
  }

  async tryGetOrWaitCurrentUser(mouse: Mouse): Promise<Result<UserSession, Error>> {
    return await Result.unthrow(async t => {
      const currentUserQuery = await this.make(getCurrentUser())

      if (currentUserQuery.current !== undefined)
        return new Ok(currentUserQuery.current.inner)

      const height = 630
      const width = 400

      const top = Math.max(mouse.y - (height / 2), 0)
      const left = Math.max(mouse.x - (width / 2), 0)

      const popup = await tryBrowser(async () => {
        return await browser.windows.create({ type: "popup", url: "index.html", state: "normal", height, width, top, left })
      }).then(r => r.throw(t))

      const future = new Future<Result<UserSession, Error>>()

      const onState = () => {
        if (currentUserQuery.current === undefined)
          return
        future.resolve(new Ok(currentUserQuery.current.inner))
      }

      const onRemoved = (id: number) => {
        if (id !== popup.id)
          return
        future.resolve(new Err(new Error()))
      }

      try {
        this.core.onState.addListener(currentUserQuery.key, onState)
        browser.windows.onRemoved.addListener(onRemoved)

        return await future.promise
      } finally {
        this.core.onState.removeListener(currentUserQuery.key, onState)
        browser.windows.onRemoved.removeListener(onRemoved)
      }
    })
  }

  async tryRouteForeground(request: RpcRequestInit<unknown>): Promise<Result<unknown, Error>> {
    if (request.method === "brume_getUsers")
      return await this.brume_getUsers(request)
    if (request.method === "brume_newUser")
      return await this.brume_newUser(request)
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
    if (request.method === "brume_call_ethereum")
      return await this.brume_call_ethereum(request)
    if (request.method === "brume_log")
      return await this.brume_log(request)
    return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
  }

  async tryRouteContentScript(uuid: string, request: RpcRequestInit<unknown>, mouse: Mouse): Promise<Result<unknown, Error>> {
    return Result.unthrow(async t => {
      if (request.method === "brume_ping")
        return new Ok(undefined)

      if (request.method === "eth_requestAccounts")
        return await this.eth_requestAccounts(uuid, request, mouse)

      const sessionQuery = await this.make(getEthereumSession(uuid))
      const session = Option.wrap(sessionQuery.current?.inner).ok().throw(t)

      const brumes = await this.#getOrCreateEthereumBrumes(session.wallet)

      const ethereum = { session, brumes }

      if (request.method === "eth_accounts")
        return await this.eth_accounts(ethereum, request)
      if (request.method === "eth_sendTransaction")
        return await this.eth_sendTransaction(ethereum, request)
      if (request.method === "personal_sign")
        return await this.personal_sign(ethereum, request)
      if (request.method === "eth_signTypedData_v4")
        return await this.eth_signTypedData_v4(ethereum, request)

      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const query = await this.make(getEthereumUnknown(ethereum, request, storage))

      await query.fetch().then(r => r.ignore())

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, Error>(stored, {})
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async eth_requestAccounts(uuid: string, request: RpcRequestPreinit<unknown>, mouse: Mouse): Promise<Result<[string], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = await this.tryGetOrWaitCurrentUser(mouse).then(r => r.throw(t))

      const walletsQuery = await this.make(getWallets(storage))
      const wallet = Option.wrap(walletsQuery.current?.get().at(0)).ok().throw(t)
      const chain = Option.wrap(chains[137]).ok().throw(t)

      const sessionQuery = await this.make(getEthereumSession(uuid))
      const sessionData: EthereumSession = { wallet, chain }
      await sessionQuery.mutate(Mutators.data(sessionData))

      const walletQuery = await this.make(getWallet(wallet.uuid, storage))
      const address = Option.wrap(walletQuery.current?.get().address).ok().throw(t)

      return new Ok([address])
    })
  }

  async eth_accounts(ethereum: EthereumSessionAndBrumes, request: RpcRequestPreinit<unknown>): Promise<Result<[string], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const walletQuery = await this.make(getWallet(ethereum.session.wallet.uuid, storage))
      const address = Option.wrap(walletQuery.current?.get().address).ok().throw(t)

      return new Ok([address])
    })
  }

  async eth_getBalance(ethereum: EthereumSessionAndBrumes, request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [address, block] = (request as RpcParamfulRequestPreinit<[string, string]>).params

      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const query = await this.make(getEthereumBalance(ethereum, address, block, storage))

      await query.fetch().then(r => r.ignore())

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, Error>(stored, {})
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
    })
  }

  async eth_sendTransaction(ethereum: EthereumSessionAndBrumes, request: RpcRequestPreinit<unknown>): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const walletQuery = await this.make(getWallet(ethereum.session.wallet.uuid, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      const circuit = await ethereum.brumes.inner.tryGet(0).then(r => r.throw(t))
      const socket = Option.wrap(circuit.chains[ethereum.session.chain.id]).ok().throw(t)

      const nonce = await EthereumSocket.request<string>(socket, {
        method: "eth_getTransactionCount",
        params: [wallet.address, "pending"]
      }).then(r => r.throw(t).throw(t))

      const gasPrice = await EthereumSocket.request<string>(socket, {
        method: "eth_gasPrice"
      }).then(r => r.throw(t).throw(t))

      const [{ data, gas, from, to, value }] = (request as RpcParamfulRequestInit<[{ data: string, gas: string, from: string, to: string, value: string }]>).params

      const signature = await new ethers.Wallet(wallet.privateKey).signTransaction({
        data: data,
        to: to,
        from: from,
        gasLimit: gas,
        chainId: ethereum.session.chain.id,
        gasPrice: gasPrice,
        nonce: parseInt(nonce, 16),
        value: value
      })

      const signal = AbortSignal.timeout(600_000)

      return await EthereumSocket.request<string>(socket, {
        method: "eth_sendRawTransaction",
        params: [signature]
      }, signal).then(r => r.throw(t))
    })
  }

  async personal_sign(ethereum: EthereumSessionAndBrumes, request: RpcRequestInit<unknown>): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const walletsQuery = await this.make(getWallets(storage))
      const first = Option.wrap(walletsQuery.current?.get().at(0)).ok().throw(t)

      const walletQuery = await this.make(getWallet(first.uuid, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      const [address, data] = (request as RpcParamfulRequestInit<[string, string]>).params

      const signature = await new ethers.Wallet(wallet.privateKey).signMessage(Bytes.fromHexSafe(data))

      return new Ok(signature)
    })
  }

  async eth_signTypedData_v4(ethereum: EthereumSessionAndBrumes, request: RpcRequestInit<unknown>): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const walletsQuery = await this.make(getWallets(storage))
      const first = Option.wrap(walletsQuery.current?.get().at(0)).ok().throw(t)

      const walletQuery = await this.make(getWallet(first.uuid, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      const [address, data] = (request as RpcParamfulRequestInit<[string, string]>).params

      const { domain, types, message } = JSON.parse(data)

      delete types["EIP712Domain"]

      const signature = await new ethers.Wallet(wallet.privateKey).signTypedData(domain, types, message)

      return new Ok(signature)
    })
  }

  async brume_getUsers(request: RpcRequestPreinit<unknown>): Promise<Result<User[], never>> {
    return await Result.unthrow(async t => {
      const usersQuery = await this.make(getUsers(this.storage))
      const users = usersQuery?.current?.get() ?? []

      return new Ok(users)
    })
  }

  async brume_newUser(request: RpcRequestPreinit<unknown>): Promise<Result<User[], Error>> {
    return await Result.unthrow(async t => {
      const [init] = (request as RpcParamfulRequestInit<[UserInit]>).params

      const usersQuery = await this.make(getUsers(this.storage))
      const user = await tryCreateUser(init).then(r => r.throw(t))

      const usersState = await usersQuery.mutate(Mutators.push<User, never>(user))
      const users = Option.wrap(usersState.get().current?.get()).ok().throw(t)

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

      const userQuery = await this.make(getUser(uuid, this.storage))
      const userData = Option.wrap(userQuery.current?.get()).ok().throw(t)

      const user: User = { ref: true, uuid: userData.uuid }
      const storage = await tryCreateUserStorage(userData, password).then(r => r.throw(t))

      const currentUserQuery = await this.make(getCurrentUser())
      const currentUserData: UserSession = { user, storage }
      await currentUserQuery.mutate(Mutators.data(currentUserData))

      return Ok.void()
    })
  }

  async brume_getCurrentUser(request: RpcRequestPreinit<unknown>): Promise<Result<Optional<UserData>, never>> {
    const currentUserQuery = await this.make(getCurrentUser())

    if (currentUserQuery.current === undefined)
      return new Ok(undefined)

    const user = currentUserQuery.current.inner.user
    const userQuery = await this.make(getUser(user.uuid, this.storage))

    return new Ok(userQuery.current?.inner)
  }

  async brume_getWallets(request: RpcRequestPreinit<unknown>): Promise<Result<Wallet[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const walletsQuery = await this.make(getWallets(storage))
      const wallets = walletsQuery.current?.get() ?? []

      return new Ok(wallets)
    })
  }

  async brume_newWallet(request: RpcRequestPreinit<unknown>): Promise<Result<Wallet[], Error>> {
    return await Result.unthrow(async t => {
      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const [wallet] = (request as RpcParamfulRequestInit<[EthereumPrivateKeyWallet]>).params
      const walletsQuery = await this.make(getWallets(storage))

      const walletsState = await walletsQuery.mutate(Mutators.push<Wallet, never>(wallet))
      const wallets = Option.wrap(walletsState.get().current?.get()).ok().throw(t)

      return new Ok(wallets)
    })
  }

  async brume_getWallet(request: RpcRequestPreinit<unknown>): Promise<Result<WalletData, Error>> {
    return await Result.unthrow(async t => {
      const [uuid] = (request as RpcParamfulRequestInit<[string]>).params

      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const walletQuery = await this.make(getWallet(uuid, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      return new Ok(wallet)
    })
  }

  async #getOrCreateEthereumBrumes(wallet: Wallet): Promise<EthereumBrumes> {
    const brumesQuery = await this.make(getEthereumBrumes(wallet))

    if (brumesQuery.current !== undefined)
      return brumesQuery.current.inner

    const brumes = EthereumBrume.createSubpool(this.brumes, { capacity: 3 })
    await brumesQuery.mutate(Mutators.data(brumes))
    return brumes
  }

  async brume_get_global(request: RpcRequestPreinit<unknown>): Promise<Result<Optional<RawState>, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcParamfulRequestInit<[string]>).params

      const cached = this.core.raw.get(cacheKey)

      if (cached !== undefined)
        return new Ok(cached.inner)

      const stored = await this.storage.get(cacheKey)
      this.core.raw.set(cacheKey, Option.wrap(stored))

      return new Ok(stored)
    })
  }

  async brume_get_user(request: RpcRequestPreinit<unknown>): Promise<Result<Optional<RawState>, Error>> {
    return await Result.unthrow(async t => {
      const [cacheKey] = (request as RpcParamfulRequestInit<[string]>).params

      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const cached = this.core.raw.get(cacheKey)

      if (cached !== undefined)
        return new Ok(cached.inner)

      const stored = await storage.get(cacheKey)
      this.core.raw.set(cacheKey, Option.wrap(stored))

      return new Ok(stored)
    })
  }

  async brume_call_ethereum(request: RpcRequestPreinit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [walletId, chainId, subrequest] = (request as RpcParamfulRequestInit<[string, number, RpcRequestPreinit<unknown>]>).params

      const { storage } = await this.tryGetCurrentUser().then(r => r.throw(t))

      const walletQuery = await this.make(getWallet(walletId, storage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)
      const chain = Option.wrap(chains[chainId]).ok().throw(t)

      const session: EthereumSession = { wallet, chain }

      const brumes = await this.#getOrCreateEthereumBrumes(wallet)

      const ethereum = { session, brumes }

      if (subrequest.method === "eth_getBalance")
        return await this.eth_getBalance(ethereum, subrequest)
      if (subrequest.method === "eth_sendTransaction")
        return await this.eth_sendTransaction(ethereum, subrequest)

      const query = await this.make(getEthereumUnknown(ethereum, subrequest, storage))

      await query.fetch().then(r => r.ignore())

      const stored = this.core.raw.get(query.cacheKey)?.inner
      const unstored = await this.core.unstore<any, unknown, Error>(stored, {})
      const fetched = Option.wrap(unstored.current).ok().throw(t)

      return fetched
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

    port.addEventListener("message", async (event: MessageEvent<RpcRequestInit<unknown>>) => {
      console.log("foreground", "->", event.data)
      const result = await inited.then(r => r.andThenSync(g => g.tryRouteForeground(event.data)))
      const response = RpcResponse.rewrap(event.data.id, result)
      console.log("foreground", "<-", response)
      Result.catchAndWrapSync(() => port.postMessage(response)).ignore()
    })

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
    const uuid = crypto.randomUUID()

    port.onMessage.addListener(async (message: {
      request: RpcRequestInit<unknown>
      mouse: Mouse
    }) => {
      const { request, mouse } = message

      if (request.id !== "ping")
        console.log(port.name, "->", request)

      const result = await Result.unthrow<Result<unknown, unknown>>(async t => {
        const global = await inited.then(r => r.throw(t))
        const result = await global.tryRouteContentScript(uuid, request, mouse).then(r => r.throw(t))

        return new Ok(result)
      })

      const response = RpcResponse.rewrap(request.id, result)

      if (request.id !== "ping")
        console.log(port.name, "<-", response)

      tryBrowserSync(() => port.postMessage(response)).ignore()
    })
  }

  const onForeground = (port: chrome.runtime.Port) => {
    port.onMessage.addListener(async (msg) => {
      console.log(port.name, "->", msg, Date.now())
      const result = await inited.then(r => r.andThenSync(g => g.tryRouteForeground(msg)))
      const response = RpcResponse.rewrap(msg.id, result)
      console.log(port.name, "<-", response, Date.now())
      tryBrowserSync(() => port.postMessage(response)).ignore()
    })
  }

  browser.runtime.onConnect.addListener(port => {
    if (port.name === "content_script")
      return void onContentScript(port)
    if (port.name === "foreground")
      return void onForeground(port)
    throw new Panic(`Invalid port name`)
  })

}