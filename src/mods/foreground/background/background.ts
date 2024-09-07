import { BrowserError, browser } from "@/libs/browser/browser"
import { ExtensionRpcRouter, MessageRpcRouter, RpcRouter } from "@/libs/channel/channel"
import { isProdWebsite, isSafariExtension } from "@/libs/platform/platform"
import { AutoPool } from "@/libs/pool"
import { urlOf } from "@/libs/url/url"
import { Box, Deferred, Stack } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { Immutable } from "@hazae41/immutable"
import { RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { SuperEventTarget } from "@hazae41/plume"

export type Background =
  | ServiceWorkerBackground
  | WorkerBackground
  | ExtensionBackground

export class ServiceWorkerBackground {
  readonly ports = createServiceWorkerPortPool(this)

  readonly events = new SuperEventTarget<{
    "request": (request: RpcRequestInit<unknown>) => unknown
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

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>): Promise<RpcResponse<T>> {
    const port = await this.ports.get().getOrThrow(0)
    return await port.get().requestOrThrow<T>(init)
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
    return location.reload() as never

  setInterval(() => serviceWorker.postMessage("PING"), 1000)

  return serviceWorker
}

export function createServiceWorkerPortPool(background: ServiceWorkerBackground) {
  const resolveOnServiceWorker = getServiceWorkerOrThrow(background)

  resolveOnServiceWorker.catch(() => { })

  const pool = new AutoPool<Disposer<MessageRpcRouter>>(async (params) => {
    const { index, signal } = params

    using stack = new Box(new Stack())

    const serviceWorker = await resolveOnServiceWorker

    const raw = new MessageChannel()

    const onRawClean = () => {
      raw.port1.close()
      raw.port2.close()
    }

    using substack = new Box(new Stack())

    const channel = new Disposer(raw, onRawClean)
    substack.getOrThrow().push(channel)

    const router = new MessageRpcRouter("background", raw.port1)
    substack.getOrThrow().push(router)

    const unsubstack = substack.unwrapOrThrow()

    const entry = new Box(new Disposer(router, () => unsubstack[Symbol.dispose]()))
    stack.getOrThrow().push(entry)

    raw.port1.start()
    raw.port2.start()

    serviceWorker.postMessage("FOREGROUND->BACKGROUND", [raw.port2])

    await router.waitHelloOrThrow(AbortSignal.any([signal, AbortSignal.timeout(1000)]))

    router.runPingLoop()

    const onRequest = (request: RpcRequestInit<unknown>) => background.onRequest(router, request)
    const onResponse = (response: RpcResponseInit<unknown>) => background.onResponse(router, response)

    stack.getOrThrow().push(new Deferred(router.events.on("request", onRequest, { passive: true })))
    stack.getOrThrow().push(new Deferred(router.events.on("response", onResponse, { passive: true })))

    const onCloseOrError = () => void pool.restart(index)

    stack.getOrThrow().push(new Deferred(router.events.on("close", onCloseOrError, { passive: true })))
    stack.getOrThrow().push(new Deferred(router.events.on("error", onCloseOrError, { passive: true })))

    const unstack = stack.unwrapOrThrow()

    return new Disposer(entry, () => unstack[Symbol.dispose]())
  }, 1)

  return new Disposer(pool, () => { })
}

export class WorkerBackground {
  readonly ports = createWorkerPortPool(this)

  readonly events = new SuperEventTarget<{
    "request": (request: RpcRequestInit<unknown>) => unknown
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  async onRequest(port: RpcRouter, request: RpcRequestInit<unknown>) {
    return await this.events.emit("request", request)
  }

  async onResponse(port: RpcRouter, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", response)
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>): Promise<RpcResponse<T>> {
    const port = await this.ports.get().getOrThrow(0)
    return await port.get().requestOrThrow<T>(init)
  }

}

export function createWorkerPortPool(background: WorkerBackground) {
  const pool = new AutoPool<Disposer<MessageRpcRouter>>(async (params) => {
    const { index, signal } = params

    using stack = new Box(new Stack())

    const raw = new MessageChannel()

    const onRawClean = () => {
      raw.port1.close()
      raw.port2.close()
    }

    using substack = new Box(new Stack())

    const worker = new Disposer(new Worker("/service_worker.js"), w => w.terminate())
    substack.getOrThrow().push(worker)

    const channel = new Disposer(raw, onRawClean)
    substack.getOrThrow().push(channel)

    const router = new MessageRpcRouter("background", raw.port1)
    substack.getOrThrow().push(router)

    const unsubstack = substack.unwrapOrThrow()

    const entry = new Box(new Disposer(router, () => unsubstack[Symbol.dispose]()))
    stack.getOrThrow().push(entry)

    raw.port1.start()
    raw.port2.start()

    worker.get().postMessage("FOREGROUND->BACKGROUND", [raw.port2])

    await router.waitHelloOrThrow(AbortSignal.any([signal, AbortSignal.timeout(1000)]))

    router.runPingLoop()

    const onRequest = (request: RpcRequestInit<unknown>) => background.onRequest(router, request)
    const onResponse = (response: RpcResponseInit<unknown>) => background.onResponse(router, response)

    stack.getOrThrow().push(new Deferred(router.events.on("request", onRequest, { passive: true })))
    stack.getOrThrow().push(new Deferred(router.events.on("response", onResponse, { passive: true })))

    const onCloseOrError = () => void pool.restart(index)

    stack.getOrThrow().push(new Deferred(router.events.on("close", onCloseOrError, { passive: true })))
    stack.getOrThrow().push(new Deferred(router.events.on("error", onCloseOrError, { passive: true })))

    const unstack = stack.unwrapOrThrow()

    return new Disposer(entry, () => unstack[Symbol.dispose]())
  }, 1)

  return new Disposer(pool, () => { })
}

export class ExtensionBackground {
  readonly ports = createExtensionChannelPool(this)

  readonly events = new SuperEventTarget<{
    "request": (request: RpcRequestInit<unknown>) => unknown
    "response": (response: RpcResponseInit<unknown>) => void
  }>()

  async onRequest(port: RpcRouter, request: RpcRequestInit<unknown>) {
    return await this.events.emit("request", request)
  }

  async onResponse(port: RpcRouter, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", response)
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>): Promise<RpcResponse<T>> {
    const port = await this.ports.get().getOrThrow(0)
    return await port.get().requestOrThrow<T>(init)
  }

}

export function createExtensionChannelPool(background: ExtensionBackground) {
  const pool = new AutoPool<Disposer<ExtensionRpcRouter>>(async (params) => {
    const { index, signal } = params

    using stack = new Box(new Stack())

    await new Promise(ok => setTimeout(ok, 1))

    let router: ExtensionRpcRouter

    try {
      const port = BrowserError.connectOrThrow({ name: "foreground->background" })
      using dport = new Box(new Disposer(port, () => port.disconnect()))

      router = new ExtensionRpcRouter("background", port)
      await router.waitHelloOrThrow(AbortSignal.any([signal, AbortSignal.timeout(1000)]))

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

    const onEntryClean = () => router.port.disconnect()
    const entry = new Box(new Disposer(router, onEntryClean))
    stack.getOrThrow().push(entry)

    const onRequest = (request: RpcRequestInit<unknown>) => background.onRequest(router, request)
    const onResponse = (response: RpcResponseInit<unknown>) => background.onResponse(router, response)

    stack.getOrThrow().push(new Deferred(router.events.on("request", onRequest, { passive: true })))
    stack.getOrThrow().push(new Deferred(router.events.on("response", onResponse, { passive: true })))

    const onCloseOrError = () => void pool.restart(index)

    stack.getOrThrow().push(new Deferred(router.events.on("close", onCloseOrError, { passive: true })))
    stack.getOrThrow().push(new Deferred(router.events.on("error", onCloseOrError, { passive: true })))

    const unstack = stack.unwrapOrThrow()

    return new Disposer(entry, () => unstack[Symbol.dispose]())
  }, 1)

  return new Disposer(pool, () => { })
}