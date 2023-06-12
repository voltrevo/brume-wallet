import { browser } from "@/libs/browser/browser"
import { RpcRequestInit, RpcResponse, RpcResponseInit } from "@/libs/rpc"
import { Mutators } from "@/libs/xswr/mutators"
import { Catched, Err, Ok, Panic, Result } from "@hazae41/result"
import { Core } from "@hazae41/xswr"
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from "workbox-precaching"
import { getUsers } from "./entities/users/all/data"
import { User, UserData, UserInit, getUser, tryCreateUser } from "./entities/users/data"
import { createGlobalStorage } from "./storage"

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

const memory: {
  session?: {
    uuid: string,
    password: string
  }
} = {}

const core = new Core({})
const storage = createGlobalStorage()

async function brume_getUsers(request: RpcRequestInit): Promise<Result<User[], unknown>> {
  const users = await getUsers(storage)?.make(core)

  if (!users)
    return new Err(new Panic(`No users`))
  if (!users.current)
    return new Ok([])
  return users.current
}

async function brume_newUser(request: RpcRequestInit): Promise<Result<User[], unknown>> {
  return await Result.unthrow(async t => {
    const [init] = request.params as [UserInit]
    const users = await getUsers(storage)?.make(core)

    const user = await tryCreateUser(init).then(r => r.throw(t))
    await users?.mutate(Mutators.push(user))

    if (!users?.current)
      return new Err(new Panic(`No users`))
    return users.current
  })
}

async function brume_getUser(request: RpcRequestInit): Promise<Result<UserData, unknown>> {
  const [uuid] = request.params as [string]
  const user = await getUser(uuid, storage)?.make(core)

  if (!user?.current)
    return new Err(new Panic(`No user`))
  return user.current
}


async function brume_session(request: RpcRequestInit) {
  return new Ok(memory.session)
}

async function brume_login(request: RpcRequestInit) {
  const [uuid, password] = request.params as [string, string]
  memory.session = { uuid, password }
  return Ok.void()
}

async function tryRouteForeground(request: RpcRequestInit): Promise<Result<unknown, unknown>> {
  if (request.method === "brume_getUsers")
    return await brume_getUsers(request)
  if (request.method === "brume_newUser")
    return await brume_newUser(request)
  if (request.method === "brume_getUser")
    return await brume_getUser(request)
  if (request.method === "brume_login")
    return await brume_login(request)
  if (request.method === "brume_session")
    return await brume_session(request)
  return new Err(new Error(`Invalid JSON-RPC request ${request.method}`))
}

async function tryRouteContentScript(request: RpcRequestInit): Promise<Result<unknown, Error>> {
  if (request.method === "eth_requestAccounts")
    return new Ok(["0x39dfd20386F5d17eBa42763606B8c704FcDd1c1D"])
  if (request.method === "eth_accounts")
    return new Ok(["0x39dfd20386F5d17eBa42763606B8c704FcDd1c1D"])
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
    browser.runtime.onConnect.addListener(port => {
      if (port.name !== "content_script")
        return
      port.onMessage.addListener(async (msg: RpcRequestInit) => {
        const result = await tryRouteContentScript(msg)
        const response = RpcResponse.rewrap(msg.id, result)
        port.postMessage(RpcResponseInit.from(response))
      })
    })

    browser.runtime.onConnect.addListener(port => {
      if (port.name !== "foreground")
        return
      port.onMessage.addListener(async (msg) => {
        console.log("->", msg)
        const result = await tryRouteForeground(msg)
        const response = RpcResponse.rewrap(msg.id, result)
        console.log("<-", response)
        port.postMessage(RpcResponseInit.from(response))
      })
    })
  }
}

main()