import { BrowserError, browser } from "@/libs/browser/browser"
import { ExtensionRpcRouter, MessageRpcRouter, RpcRouter } from "@/libs/channel/channel"
import { isProdWebsite, isSafariExtension } from "@/libs/platform/platform"
import { urlOf } from "@/libs/url/url"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { Immutable } from "@hazae41/immutable"
import { RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { None } from "@hazae41/option"
import { Pool } from "@hazae41/piscine"
import { SuperEventTarget } from "@hazae41/plume"
import { Result } from "@hazae41/result"

export type Background =
  | ServiceWorkerBackground
  | WorkerBackground
  | ExtensionBackground

export class ServiceWorkerBackground {
  readonly ports = createServiceWorkerPortPool(this)

  readonly events = new SuperEventTarget<{
    "request": (request: RpcRequestInit<unknown>) => Result<unknown, Error>
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  readonly serviceWorker = new SuperEventTarget<{
    "update": (update: () => void) => void
  }>()

  async onRequest(port: RpcRouter, request: RpcRequestInit<unknown>) {
    return await this.events.emit("request", request)
  }

  async onResponse(port: RpcRouter, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", response)
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.runAndDoubleWrap(() => this.requestOrThrow(init))
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>): Promise<RpcResponse<T>> {
    const port = await this.ports.getOrThrow(0).then(r => r.unwrap().inner.inner.inner)

    return await port.requestOrThrow<T>(init)
  }

}

export async function getServiceWorkerOrThrow(background: ServiceWorkerBackground): Promise<ServiceWorker> {
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload())

  const update = isProdWebsite()
    ? await Immutable.register("./service_worker.latest.js")
    : void await navigator.serviceWorker.register("./service_worker.js")

  if (update != null)
    await background.serviceWorker.emit("update", update)

  const serviceWorker = await navigator.serviceWorker.ready.then(r => r.active)

  if (serviceWorker == null)
    location.reload()

  return serviceWorker!
}

export function createServiceWorkerPortPool(background: ServiceWorkerBackground): Pool<Disposer<MessageRpcRouter>> {
  const resolveOnServiceWorker = getServiceWorkerOrThrow(background)

  resolveOnServiceWorker.catch(() => { })

  return new Pool<Disposer<MessageRpcRouter>>(async (params) => {
    const { pool, index } = params

    const serviceWorker = await resolveOnServiceWorker

    const rawChannel = new MessageChannel()

    const onRawClean = () => {
      rawChannel.port1.close()
      rawChannel.port2.close()
    }

    using preChannel = new Box(new Disposer(rawChannel, onRawClean))
    using preRouter = new Box(new MessageRpcRouter("background", rawChannel.port1))

    const channel = preChannel.unwrapOrThrow()
    const router = preRouter.unwrapOrThrow()

    const onWrapperClean = () => {
      using _1 = channel
      using _2 = router
    }

    using preWrapper = new Box(new Disposer(router, onWrapperClean))

    rawChannel.port1.start()
    rawChannel.port2.start()

    serviceWorker.postMessage("FOREGROUND->BACKGROUND", [rawChannel.port2])

    await router.waitHelloOrThrow(AbortSignal.timeout(1000))

    router.runPingLoop()

    const onClose = async () => {
      pool.restart(index)
      return new None()
    }

    const onRequest = (request: RpcRequestInit<unknown>) => background.onRequest(router, request)
    const onResponse = (response: RpcResponseInit<unknown>) => background.onResponse(router, response)

    using preOnRequestDisposer = new Box(new Disposer({}, router.events.on("request", onRequest, { passive: true })))
    using preOnResponseDisposer = new Box(new Disposer({}, router.events.on("response", onResponse, { passive: true })))
    using preOnCloseDisposer = new Box(new Disposer({}, router.events.on("close", onClose, { passive: true })))

    const wrapper = preWrapper.moveOrThrow()
    const onRequestDisposer = preOnRequestDisposer.moveOrThrow()
    const onResponseDisposer = preOnResponseDisposer.moveOrThrow()
    const onCloseDisposer = preOnCloseDisposer.moveOrThrow()

    const onEntryClean = () => {
      using _0 = wrapper
      using _1 = onRequestDisposer
      using _2 = onResponseDisposer
      using _3 = onCloseDisposer
    }

    return new Disposer(wrapper, onEntryClean)
  }, { capacity: 1 })
}

export class WorkerBackground {
  readonly ports = createWorkerPortPool(this)

  readonly events = new SuperEventTarget<{
    "request": (request: RpcRequestInit<unknown>) => Result<unknown, Error>
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  async onRequest(port: RpcRouter, request: RpcRequestInit<unknown>) {
    return await this.events.emit("request", request)
  }

  async onResponse(port: RpcRouter, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", response)
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.runAndDoubleWrap(() => this.requestOrThrow(init))
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>): Promise<RpcResponse<T>> {
    const port = await this.ports.getOrThrow(0).then(r => r.unwrap().inner.inner.inner)

    return await port.requestOrThrow<T>(init)
  }

}

export function createWorkerPortPool(background: WorkerBackground): Pool<Disposer<MessageRpcRouter>> {
  return new Pool<Disposer<MessageRpcRouter>>(async (params) => {
    const { pool, index } = params

    const rawChannel = new MessageChannel()

    const onRawClean = () => {
      rawChannel.port1.close()
      rawChannel.port2.close()
    }

    using preWorker = new Box(new Disposer(new Worker("/service_worker.js"), w => w.terminate()))
    using preChannel = new Box(new Disposer(rawChannel, onRawClean))
    using preRouter = new Box(new MessageRpcRouter("background", rawChannel.port1))

    const worker = preWorker.unwrapOrThrow()
    const channel = preChannel.unwrapOrThrow()
    const router = preRouter.unwrapOrThrow()

    const onWrapperClean = () => {
      using _0 = worker
      using _1 = channel
      using _2 = router
    }

    using preWrapper = new Box(new Disposer(router, onWrapperClean))

    rawChannel.port1.start()
    rawChannel.port2.start()

    worker.get().postMessage("FOREGROUND->BACKGROUND", [rawChannel.port2])

    await router.waitHelloOrThrow(AbortSignal.timeout(1000))

    router.runPingLoop()

    const onClose = async () => {
      pool.restart(index)
      return new None()
    }

    const onRequest = (request: RpcRequestInit<unknown>) => background.onRequest(router, request)
    const onResponse = (response: RpcResponseInit<unknown>) => background.onResponse(router, response)

    using preOnRequestDisposer = new Box(new Disposer({}, router.events.on("request", onRequest, { passive: true })))
    using preOnResponseDisposer = new Box(new Disposer({}, router.events.on("response", onResponse, { passive: true })))
    using preOnCloseDisposer = new Box(new Disposer({}, router.events.on("close", onClose, { passive: true })))

    const wrapper = preWrapper.moveOrThrow()
    const onRequestDisposer = preOnRequestDisposer.moveOrThrow()
    const onResponseDisposer = preOnResponseDisposer.moveOrThrow()
    const onCloseDisposer = preOnCloseDisposer.moveOrThrow()

    const onEntryClean = () => {
      using _0 = wrapper
      using _1 = onRequestDisposer
      using _2 = onResponseDisposer
      using _3 = onCloseDisposer
    }

    return new Disposer(wrapper, onEntryClean)
  }, { capacity: 1 })
}

export class ExtensionBackground {
  readonly ports = createExtensionChannelPool(this)

  readonly events = new SuperEventTarget<{
    "request": (request: RpcRequestInit<unknown>) => Result<unknown, Error>
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  async onRequest(port: RpcRouter, request: RpcRequestInit<unknown>) {
    return await this.events.emit("request", request)
  }

  async onResponse(port: RpcRouter, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", response)
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>): Promise<RpcResponse<T>> {
    const port = await this.ports.getOrThrow(0).then(r => r.unwrap().inner.inner.inner)

    return await port.requestOrThrow<T>(init)
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.runAndDoubleWrap(() => this.requestOrThrow(init))
  }

}

export function createExtensionChannelPool(background: ExtensionBackground): Pool<Disposer<ExtensionRpcRouter>> {
  return new Pool<Disposer<ExtensionRpcRouter>>(async (params) => {
    const { index, pool } = params

    using stack = new Box(new DisposableStack())

    await new Promise(ok => setTimeout(ok, 1))

    let router: ExtensionRpcRouter

    try {
      const port = BrowserError.connectOrThrow({ name: "foreground->background" })
      using dport = new Box(new Disposer(port, () => port.disconnect()))

      router = new ExtensionRpcRouter("background", port)
      await router.waitHelloOrThrow(AbortSignal.timeout(1000))

      dport.moveOrThrow()
    } catch (e: unknown) {
      if (!isSafariExtension())
        throw e

      if (sessionStorage.getItem("#brume.opened"))
        throw e

      sessionStorage.setItem("#brume.opened", "true")

      const opener = BrowserError.runOrThrowSync(() => browser.runtime.getURL("/opener.html"))
      const opened = urlOf(opener, { url: location.href })

      location.replace(opened)

      throw e
    }

    const entry = new Box(new Disposer(router, () => router.port.disconnect()))
    stack.getOrThrow().use(entry)

    const onCloseOrError = async () => {
      pool.restart(index)
      return new None()
    }

    stack.getOrThrow().defer(router.events.on("close", onCloseOrError, { passive: true }))
    stack.getOrThrow().defer(router.events.on("error", onCloseOrError, { passive: true }))

    const onRequest = (request: RpcRequestInit<unknown>) => background.onRequest(router, request)
    const onResponse = (response: RpcResponseInit<unknown>) => background.onResponse(router, response)

    stack.getOrThrow().defer(router.events.on("request", onRequest, { passive: true }))
    stack.getOrThrow().defer(router.events.on("response", onResponse, { passive: true }))

    const unstack = stack.unwrapOrThrow()

    return new Disposer(entry, () => unstack.dispose())
  }, { capacity: 1 })
}