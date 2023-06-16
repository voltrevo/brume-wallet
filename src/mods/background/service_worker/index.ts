import { browser, tryBrowserSync } from "@/libs/browser/browser"
import { chains } from "@/libs/ethereum/chain"
import { RpcParamfulRequestInit, RpcRequestInit, RpcRequestPreinit, RpcResponse } from "@/libs/rpc"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { createTorPool, tryCreateTor } from "@/libs/tor/tors/tors"
import { Mutators } from "@/libs/xswr/mutators"
import { Berith } from "@hazae41/berith"
import { Circuit, Fallback, TorClientDuplex } from "@hazae41/echalote"
import { Ed25519 } from "@hazae41/ed25519"
import { Morax } from "@hazae41/morax"
import { Mutex } from "@hazae41/mutex"
import { Option, Optional, Some } from "@hazae41/option"
import { Cancel, Looped, Pool, Retry, tryLoop } from "@hazae41/piscine"
import { Catched, Err, Ok, Panic, Result } from "@hazae41/result"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
import { Core, Fetched, IDBStorage, Makeable, StoredState } from "@hazae41/xswr"
import { ethers } from "ethers"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { CircuitSession, EthereumSocket, SessionData, getSession } from "./entities/sessions/data"
import { getUsers } from "./entities/users/all/data"
import { User, UserData, UserInit, UserSession, getUser, tryCreateUser } from "./entities/users/data"
import { getWallets } from "./entities/wallets/all/data"
import { EthereumPrivateKeyWallet, Wallet, WalletData, getEthereum, getWallet } from "./entities/wallets/data"
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

  #session?: UserSession

  constructor(
    readonly tors: Mutex<Pool<TorClientDuplex, Error>>,
    readonly circuits: Mutex<Pool<Circuit, Error>>,
    readonly sessions: Mutex<Pool<CircuitSession, Error>>,
    readonly storage: IDBStorage
  ) { }

  async make<T>(makeable: Makeable<T>) {
    return await makeable.make(this.core)
  }

  async destroy(sessionId: string) {
    const sessionQuery = await this.make(getSession(sessionId))

    if (sessionQuery.data === undefined)
      return
    for (const entry of sessionQuery.data?.get().circuits.inner)
      entry.result.andThenSync(circuit => circuit.circuit.tryDestroy().then(r => r.ignore()))
  }

  async tryRouteForeground(request: RpcRequestInit<unknown>): Promise<Result<unknown, Error>> {
    if (request.method === "brume_get")
      return await this.brume_get(request)
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
    if (request.method === "brume_fetch")
      return await this.brume_fetch(request)
    return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
  }

  async tryRouteContentScript(sessionId: string, request: RpcRequestInit<unknown>): Promise<Result<unknown, Error>> {
    if (request.method === "brume_ping")
      return new Ok(undefined)
    if (request.method === "eth_requestAccounts")
      return await this.eth_requestAccounts(request)
    if (request.method === "eth_accounts")
      return await this.eth_accounts(request)
    if (request.method === "eth_sendTransaction")
      return await this.eth_sendTransaction(sessionId, request)
    if (request.method === "eth_signTypedData_v4")
      return await this.eth_signTypedData_v4(request)

    return tryLoop(async (i) => {
      return await Result.unthrow<Result<unknown, Looped<Error>>>(async t => {
        const session = await this.#tryGetOrCreateSession(sessionId).then(r => r.mapErrSync(Cancel.new).throw(t))
        const circuit = await session.circuits.inner.tryGet(i).then(r => r.mapErrSync(Retry.new).throw(t))
        const ethereum = Option.wrap(circuit.ethereum[137]).ok().mapErrSync(Cancel.new).throw(t)

        const { userStorage } = Option.wrap(this.#session).ok().mapErrSync(Cancel.new).throw(t)
        const query = await this.make(getEthereum(request, ethereum, userStorage))

        const fetched = await query.fetcher(query.key)
          .then(r => r.mapErrSync(Retry.new).throw(t))
          .then(r => Fetched.from(r))

        await query.mutate(() => new Some(fetched))

        return fetched.mapErrSync(Cancel.new)
      }).then(r => r.inspectErrSync(console.error))
    })
  }

  async eth_sendTransaction(sessionId: string, request: RpcRequestInit<unknown>): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const { userStorage } = Option.wrap(this.#session).ok().throw(t)

      const walletsQuery = await this.make(getWallets(userStorage))
      const first = Option.wrap(walletsQuery.current?.get().at(0)).ok().throw(t)

      const walletQuery = await this.make(getWallet(first.uuid, userStorage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      const session = await this.#tryGetOrCreateSession(sessionId).then(r => r.throw(t))
      const circuit = await session.circuits.inner.tryGet(0).then(r => r.throw(t))
      const ethereum = Option.wrap(circuit.ethereum[137]).ok().throw(t)

      const nonce = await EthereumSocket.tryFetch(ethereum, { method: "eth_getTransactionCount", params: [wallet.address, "pending"] }).then(r => r.throw(t).throw(t))
      const gasPrice = await EthereumSocket.tryFetch(ethereum, { method: "eth_gasPrice" }, {}).then(r => r.throw(t).throw(t))

      const [{ data, gas, from, to }] = (request as RpcParamfulRequestInit<[{ data: string, gas: string, from: string, to: string }]>).params

      const signature = await new ethers.Wallet(wallet.privateKey).signTransaction({ data, to, from, gasLimit: gas, chainId: 137, gasPrice, nonce: parseInt(nonce, 16) })

      return await EthereumSocket.tryFetch(ethereum, { method: "eth_sendRawTransaction", params: [signature] }, {}).then(r => r.throw(t))
    })
  }

  async eth_signTypedData_v4(request: RpcRequestInit<unknown>): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const { userStorage } = Option.wrap(this.#session).ok().throw(t)

      const walletsQuery = await this.make(getWallets(userStorage))
      const first = Option.wrap(walletsQuery.current?.get().at(0)).ok().throw(t)

      const walletQuery = await this.make(getWallet(first.uuid, userStorage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      const [address, data] = (request as RpcParamfulRequestInit<[string, string]>).params

      const { domain, types, message } = JSON.parse(data)

      const signature = await new ethers.Wallet(wallet.privateKey).signTypedData(domain, types, message)

      return new Ok(signature)
    })
  }

  async brume_getUsers(request: RpcRequestInit<unknown>): Promise<Result<User[], never>> {
    return await Result.unthrow(async t => {
      const usersQuery = await this.make(getUsers(this.storage))
      const users = usersQuery?.current?.get() ?? []

      return new Ok(users)
    })
  }

  async brume_newUser(request: RpcRequestInit<unknown>): Promise<Result<User[], Error>> {
    return await Result.unthrow(async t => {
      const [init] = (request as RpcParamfulRequestInit<[UserInit]>).params

      const usersQuery = await this.make(getUsers(this.storage))
      const user = await tryCreateUser(init).then(r => r.throw(t))

      const usersState = await usersQuery.mutate(Mutators.push<User, never>(user))
      const users = Option.wrap(usersState.get().current?.get()).ok().throw(t)

      return new Ok(users)
    })
  }

  async brume_getUser(request: RpcRequestInit<unknown>): Promise<Result<UserData, Error>> {
    return await Result.unthrow(async t => {
      const [uuid] = (request as RpcParamfulRequestInit<[string]>).params

      const userQuery = await this.make(getUser(uuid, this.storage))
      const user = Option.wrap(userQuery.current?.get()).ok().throw(t)

      return new Ok(user)
    })
  }

  async brume_setCurrentUser(request: RpcRequestInit<unknown>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const [uuid, password] = (request as RpcParamfulRequestInit<[string, string]>).params

      const userQuery = await this.make(getUser(uuid, this.storage))
      const userData = Option.wrap(userQuery.current?.get()).ok().throw(t)

      const userStorage = await tryCreateUserStorage(userData, password).then(r => r.throw(t))

      this.#session = { userData, userStorage }

      return Ok.void()
    })
  }

  async brume_getCurrentUser(request: RpcRequestInit<unknown>): Promise<Result<Optional<UserData>, never>> {
    return new Ok(this.#session?.userData)
  }

  async brume_getWallets(request: RpcRequestInit<unknown>): Promise<Result<Wallet[], Error>> {
    return await Result.unthrow(async t => {
      const { userStorage } = Option.wrap(this.#session).ok().throw(t)

      const walletsQuery = await this.make(getWallets(userStorage))
      const wallets = walletsQuery.current?.get() ?? []

      return new Ok(wallets)
    })
  }

  async brume_newWallet(request: RpcRequestInit<unknown>): Promise<Result<Wallet[], Error>> {
    return await Result.unthrow(async t => {
      const { userStorage } = Option.wrap(this.#session).ok().throw(t)

      const [wallet] = (request as RpcParamfulRequestInit<[EthereumPrivateKeyWallet]>).params
      const walletsQuery = await this.make(getWallets(userStorage))

      const walletsState = await walletsQuery.mutate(Mutators.push<Wallet, never>(wallet))
      const wallets = Option.wrap(walletsState.get().current?.get()).ok().throw(t)

      return new Ok(wallets)
    })
  }

  async brume_getWallet(request: RpcRequestInit<unknown>): Promise<Result<WalletData, Error>> {
    return await Result.unthrow(async t => {
      const [uuid] = (request as RpcParamfulRequestInit<[string]>).params

      const { userStorage } = Option.wrap(this.#session).ok().throw(t)

      const walletQuery = await this.make(getWallet(uuid, userStorage))
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      return new Ok(wallet)
    })
  }

  async #tryGetOrCreateSession(uuid: string): Promise<Result<SessionData, never>> {
    return await Result.unthrow(async t => {
      const sessionQuery = await this.make(getSession(uuid))

      if (sessionQuery.current !== undefined)
        return sessionQuery.current

      const circuits = CircuitSession.createSubpool(this.sessions, { capacity: 3 })

      const sessionData = { uuid, circuits }
      await sessionQuery.mutate(Mutators.data(sessionData))

      return new Ok(sessionData)
    })
  }

  async brume_get(request: RpcRequestInit<unknown>): Promise<Result<Optional<StoredState<unknown, unknown>>, Error>> {
    return await Result.unthrow(async t => {
      const [uuid, cacheKey] = (request as RpcParamfulRequestInit<[string, string]>).params

      const { userData, userStorage } = Option.wrap(this.#session).ok().throw(t)

      if (uuid !== userData.uuid)
        return new Ok(undefined)

      const state = await this.core.get(cacheKey, { storage: userStorage })
      const stored = await this.core.store(state, {})

      return new Ok(stored)
    })
  }

  async brume_fetch(request: RpcRequestInit<unknown>): Promise<Result<unknown, Error>> {
    return await Result.unthrow(async t => {
      const [sessionId, chainId, subrequest] = (request as RpcParamfulRequestInit<[string, number, RpcRequestPreinit<unknown>]>).params

      return await tryLoop(async (i) => {
        return await Result.unthrow<Result<unknown, Looped<Error>>>(async t => {
          const session = await this.#tryGetOrCreateSession(sessionId).then(r => r.mapErrSync(Cancel.new).throw(t))
          const circuit = await session.circuits.inner.tryGet(i).then(r => r.mapErrSync(Retry.new).throw(t))
          const ethereum = Option.wrap(circuit.ethereum[chainId]).ok().mapErrSync(Cancel.new).throw(t)

          const { userStorage } = Option.wrap(this.#session).ok().mapErrSync(Cancel.new).throw(t)
          const query = await this.make(getEthereum(subrequest, ethereum, userStorage))

          const fetched = await query.fetcher(query.key)
            .then(r => r.mapErrSync(Retry.new).throw(t))
            .then(r => Fetched.from(r))

          await query.mutate(() => new Some(fetched))

          return fetched.mapErrSync(Cancel.new)
        })
      })
    })
  }

  async eth_requestAccounts(request: RpcRequestInit<unknown>): Promise<Result<[string], Error>> {
    return await Result.unthrow(async t => {
      const { userStorage } = Option.wrap(this.#session).ok().throw(t)

      const walletsQuery = await this.make(getWallets(userStorage))
      const first = Option.wrap(walletsQuery.current?.get().at(0)).ok().throw(t)

      const walletQuery = await this.make(getWallet(first.uuid, userStorage))
      const address = Option.wrap(walletQuery.current?.get().address).ok().throw(t)

      return new Ok([address])
    })
  }

  async eth_accounts(request: RpcRequestInit<unknown>): Promise<Result<[string], Error>> {
    return await Result.unthrow(async t => {
      const { userStorage } = Option.wrap(this.#session).ok().throw(t)

      const walletsQuery = await this.make(getWallets(userStorage))
      const first = Option.wrap(walletsQuery.current?.get().at(0)).ok().throw(t)

      const walletQuery = await this.make(getWallet(first.uuid, userStorage))
      const address = Option.wrap(walletQuery.current?.get().address).ok().throw(t)

      return new Ok([address])
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
      const sessions = CircuitSession.createPool(chains, circuits, { capacity: 9 })

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
      // console.log("foreground", "->", event.data)
      const result = await inited.then(r => r.andThenSync(g => g.tryRouteForeground(event.data)))
      const response = RpcResponse.rewrap(event.data.id, result)
      // console.log("foreground", "<-", response)
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

    port.onMessage.addListener(async (msg: RpcRequestInit<unknown>) => {
      if (msg.id !== "ping") console.log(port.name, "->", msg)
      const result = await inited.then(r => r.andThenSync(g => g.tryRouteContentScript(uuid, msg)))
      const response = RpcResponse.rewrap(msg.id, result)
      if (msg.id !== "ping") console.log(port.name, "<-", response)
      tryBrowserSync(() => port.postMessage(response)).ignore()
    })

    port.onDisconnect.addListener(async () => {
      await inited.then(async r => r.andThenSync(g => g.destroy(uuid)))
    })
  }

  const onForeground = (port: chrome.runtime.Port) => {
    port.onMessage.addListener(async (msg) => {
      // console.log(port.name, "->", msg, Date.now())
      const result = await inited.then(r => r.andThenSync(g => g.tryRouteForeground(msg)))
      const response = RpcResponse.rewrap(msg.id, result)
      // console.log(port.name, "<-", response, Date.now())
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