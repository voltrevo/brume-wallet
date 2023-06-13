import { browser } from "@/libs/browser/browser"
import { RpcRequestInit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Mutators } from "@/libs/xswr/mutators"
import { Cleanable } from "@hazae41/cleaner"
import { Option, Optional } from "@hazae41/option"
import { Catched, Err, Ok, Panic, Result } from "@hazae41/result"
import { Core } from "@hazae41/xswr"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { getUsers } from "./entities/users/all/data"
import { User, UserData, UserInit, UserSession, getUser, tryCreateUser, tryCreateUserStorage } from "./entities/users/data"
import { getWallets } from "./entities/wallets/all/data"
import { EthereumPrivateKeyWallet, Wallet, WalletData, getWallet } from "./entities/wallets/data"
import { tryCreateGlobalStorage } from "./storage"

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

const core = new Core({})
const globalStorage = tryCreateGlobalStorage().unwrap()

const memory: {
  session?: UserSession
} = {}

async function brume_getUsers(request: RpcRequestInit): Promise<Result<User[], never>> {
  return await Result.unthrow(async t => {
    const usersQuery = await getUsers(globalStorage)?.make(core)

    return Cleanable.runWith(usersQuery, async () => {
      const users = usersQuery?.current?.get() ?? []

      return new Ok(users)
    })
  })
}

async function brume_newUser(request: RpcRequestInit): Promise<Result<User[], Error>> {
  return await Result.unthrow(async t => {
    const [init] = request.params as [UserInit]

    const usersQuery = await getUsers(globalStorage).make(core)

    return Cleanable.runWith(usersQuery, async () => {
      const user = await tryCreateUser(init).then(r => r.throw(t))

      await usersQuery.mutate(Mutators.push(user))

      const users = Option.wrap(usersQuery.current?.get()).ok().throw(t)

      return new Ok(users)
    })
  })
}

async function brume_getUser(request: RpcRequestInit): Promise<Result<UserData, Error>> {
  return await Result.unthrow(async t => {
    const [uuid] = request.params as [string]

    const userQuery = await getUser(uuid, globalStorage).make(core)

    return Cleanable.runWith(userQuery, async () => {
      const user = Option.wrap(userQuery.current?.get()).ok().throw(t)

      return new Ok(user)
    })
  })
}

async function brume_setCurrentUser(request: RpcRequestInit): Promise<Result<void, Error>> {
  return await Result.unthrow(async t => {
    const [uuid, password] = request.params as [string, string]

    const userQuery = await getUser(uuid, globalStorage).make(core)

    return Cleanable.runWith(userQuery, async () => {
      const user = Option.wrap(userQuery.current?.get()).ok().throw(t)

      const userStorage = await tryCreateUserStorage(user, password).then(r => r.throw(t))
      memory.session = { userData: user, userStorage }

      return Ok.void()
    })
  })
}

async function brume_getCurrentUser(request: RpcRequestInit): Promise<Result<Optional<UserData>, never>> {
  return new Ok(memory.session?.userData)
}

async function brume_getWallets(request: RpcRequestInit): Promise<Result<Wallet[], Error>> {
  return await Result.unthrow(async t => {
    const { userStorage } = Option.wrap(memory.session).ok().throw(t)

    const walletsQuery = await getWallets(userStorage).make(core)

    return await Cleanable.runWith(walletsQuery, async () => {
      const wallets = walletsQuery.current?.get() ?? []

      return new Ok(wallets)
    })
  })
}

async function brume_newWallet(request: RpcRequestInit): Promise<Result<Wallet[], Error>> {
  return await Result.unthrow(async t => {
    const { userStorage } = Option.wrap(memory.session).ok().throw(t)

    const [wallet] = request.params as [EthereumPrivateKeyWallet]
    const walletsQuery = await getWallets(userStorage).make(core)

    return await Cleanable.runWith(walletsQuery, async () => {
      await walletsQuery?.mutate(Mutators.push(wallet))

      const wallets = Option.wrap(walletsQuery.current?.get()).ok().throw(t)

      return new Ok(wallets)
    })
  })
}

async function brume_getWallet(request: RpcRequestInit): Promise<Result<WalletData, Error>> {
  return await Result.unthrow(async t => {
    const [uuid] = request.params as [string]

    const { userStorage } = Option.wrap(memory.session).ok().throw(t)

    const walletQuery = await getWallet(uuid, userStorage).make(core)

    return await Cleanable.runWith(walletQuery, async () => {
      const wallet = Option.wrap(walletQuery.current?.get()).ok().throw(t)

      return new Ok(wallet)
    })
  })
}

async function tryRouteForeground(request: RpcRequestInit): Promise<Result<unknown, Error>> {
  if (request.method === "brume_getUsers")
    return await brume_getUsers(request)
  if (request.method === "brume_newUser")
    return await brume_newUser(request)
  if (request.method === "brume_getUser")
    return await brume_getUser(request)
  if (request.method === "brume_setCurrentUser")
    return await brume_setCurrentUser(request)
  if (request.method === "brume_getCurrentUser")
    return await brume_getCurrentUser(request)
  if (request.method === "brume_getWallets")
    return await brume_getWallets(request)
  if (request.method === "brume_newWallet")
    return await brume_newWallet(request)
  if (request.method === "brume_getWallet")
    return await brume_getWallet(request)
  return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
}

async function eth_requestAccounts(request: RpcRequestInit): Promise<Result<unknown, Error>> {
  return await Result.unthrow(async t => {
    const { userStorage } = Option.wrap(memory.session).ok().throw(t)

    const walletsQuery = await getWallets(userStorage).make(core)

    return await Cleanable.runWith(walletsQuery, async () => {
      const first = Option.wrap(walletsQuery.current?.get().at(0)).ok().throw(t)

      const walletQuery = await getWallet(first.uuid, userStorage).make(core)

      return await Cleanable.runWith(walletQuery, async () => {
        const address = Option.wrap(walletQuery.current?.get().address).ok().throw(t)

        return new Ok([address])
      })
    })
  })
}

async function eth_accounts(request: RpcRequestInit): Promise<Result<unknown, Error>> {
  return await Result.unthrow(async t => {
    const { userStorage } = Option.wrap(memory.session).ok().throw(t)

    const walletsQuery = await getWallets(userStorage).make(core)

    return await Cleanable.runWith(walletsQuery, async () => {
      const first = Option.wrap(walletsQuery.current?.get().at(0)).ok().throw(t)

      const walletQuery = await getWallet(first.uuid, userStorage).make(core)

      return await Cleanable.runWith(walletQuery, async () => {
        const address = Option.wrap(walletQuery.current?.get().address).ok().throw(t)

        return new Ok([address])
      })
    })
  })
}

async function tryRouteContentScript(request: RpcRequestInit): Promise<Result<unknown, Error>> {
  if (request.method === "eth_requestAccounts")
    return await eth_requestAccounts(request)
  if (request.method === "eth_accounts")
    return await eth_accounts(request)
  if (request.method === "eth_chainId")
    return new Ok("0x1")
  if (request.method === "eth_blockNumber")
    return new Ok("0x65a8db")
  return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
}

async function main() {
  // await Berith.initBundledOnce()
  // await Morax.initBundledOnce()

  // const ed25519 = Ed25519.fromBerith(Berith)
  // const x25519 = X25519.fromBerith(Berith)
  // const sha1 = Sha1.fromMorax(Morax)

  // const fallbacks = await tryFetch<Fallback[]>(FALLBACKS_URL)

  // const tors = createTorPool(async () => {
  //   return await tryCreateTor2({ fallbacks, ed25519, x25519, sha1 })
  // }, { capacity: 3 })

  if (IS_WEBSITE) {

    const onSkipWaiting = (event: ExtendableMessageEvent) =>
      self.skipWaiting()

    const onHelloWorld = (event: ExtendableMessageEvent) => {
      const port = event.ports[0]

      port.addEventListener("message", async (event: MessageEvent<RpcRequestInit>) => {
        console.log("->", event.data)
        const result = await tryRouteForeground(event.data)
        const response = RpcResponse.rewrap(event.data.id, result)
        console.log("<-", response)
        port.postMessage(RpcResponseInit.from(response))
      })

      port.start()
    }

    self.addEventListener("message", (event) => {
      if (event.data === "SKIP_WAITING")
        return onSkipWaiting(event)
      if (event.data === "HELLO_WORLD")
        return onHelloWorld(event)
      throw new Panic(`Invalid message`)
    })
  }

  if (IS_EXTENSION) {

    const onContentScript = (port: chrome.runtime.Port) => {
      port.onMessage.addListener(async (msg: RpcRequestInit) => {
        const result = await tryRouteContentScript(msg)
        const response = RpcResponse.rewrap(msg.id, result)
        port.postMessage(RpcResponseInit.from(response))
      })
    }

    const onForeground = (port: chrome.runtime.Port) => {
      port.onMessage.addListener(async (msg) => {
        console.log("->", msg)
        const result = await tryRouteForeground(msg)
        const response = RpcResponse.rewrap(msg.id, result)
        console.log("<-", response)
        port.postMessage(RpcResponseInit.from(response))
      })
    }

    browser.runtime.onConnect.addListener(port => {
      if (port.name === "content_script")
        return onContentScript(port)
      if (port.name === "foreground")
        return onForeground(port)
      throw new Panic(`Invalid port name`)
    })
  }
}

main()