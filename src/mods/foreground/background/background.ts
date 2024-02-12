import { BrowserError, browser } from "@/libs/browser/browser"
import { ExtensionRpcRouter, RpcRouter, WebsiteRpcRouter } from "@/libs/channel/channel"
import { isSafariExt } from "@/libs/platform/platform"
import { AbortSignals } from "@/libs/signals/signals"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { Future } from "@hazae41/future"
import { RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc"
import { None, Some } from "@hazae41/option"
import { Pool } from "@hazae41/piscine"
import { Plume, SuperEventTarget } from "@hazae41/plume"
import { Ok, Result } from "@hazae41/result"

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
    "update": (sw: ServiceWorker) => void
  }>()

  async onRequest(port: RpcRouter, request: RpcRequestInit<unknown>) {
    return await this.events.emit("request", [request])
  }

  async onResponse(port: RpcRouter, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", [response])
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.runAndDoubleWrap(() => this.requestOrThrow(init))
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>): Promise<RpcResponse<T>> {
    const port = await this.ports.getOrThrow(0).then(r => r.unwrap().inner.inner.inner)

    return await port.requestOrThrow<T>(init)
  }

}

export async function getServiceWorkerOrThrow(background: ServiceWorkerBackground): Promise<ServiceWorkerRegistration> {
  /**
   * Safari may kill the service worker and not restart it
   * This will manual start a new one
   */
  const registration = await navigator.serviceWorker.register("/service_worker.js")

  /**
   * Only check updates on the first service worker (navigator.serviceWorker.ready)
   */
  {
    const ready = await navigator.serviceWorker.ready

    if (ready.waiting != null)
      await background.serviceWorker.emit("update", [ready.waiting])

    ready.addEventListener("updatefound", () => {
      const { installing } = ready

      if (installing == null)
        return

      const onStateChange = async () => {
        if (installing.state !== "installed")
          return
        if (navigator.serviceWorker.controller == null)
          return
        await background.serviceWorker.emit("update", [installing])
        installing.removeEventListener("statechange", onStateChange)
      }

      installing.addEventListener("statechange", onStateChange, { passive: true })
    }, { passive: true, once: true })

    let reloading = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading)
        return
      location.reload()
      reloading = true
    })
  }

  /**
   * Get or wait the service worker
   */
  {
    const { active, installing } = registration

    if (active != null)
      return registration
    if (installing == null)
      throw new Error(`registration.installing is null`)

    const future = new Future<ServiceWorkerRegistration>()

    const onStateChange = () => {
      if (installing.state !== "activated")
        return
      future.resolve(registration)
    }

    const onError = (e: ErrorEvent) => {
      future.reject(e.error)
    }

    try {
      installing.addEventListener("statechange", onStateChange, { passive: true })
      installing.addEventListener("error", onError, { passive: true })

      return await future.promise
    } finally {
      installing.removeEventListener("statechange", onStateChange)
      installing.removeEventListener("error", onError)
    }
  }
}

export function createServiceWorkerPortPool(background: ServiceWorkerBackground): Pool<Disposer<WebsiteRpcRouter>> {
  return new Pool<Disposer<WebsiteRpcRouter>>(async (params) => {
    const { pool, index } = params

    using preRegistration = new Box(new Disposer(await getServiceWorkerOrThrow(background), r => r.unregister()))

    const { active } = preRegistration.getOrThrow().get()

    if (active == null)
      throw new Error(`registration.active is null`)

    const raw = new MessageChannel()

    const onRawClean = () => {
      raw.port1.close()
      raw.port2.close()
    }

    using preChannel = new Box(new Disposer(raw, onRawClean))
    using preRouter = new Box(new WebsiteRpcRouter("background", raw.port1))

    const registration = preRegistration.unwrapOrThrow()
    const channel = preChannel.unwrapOrThrow()
    const router = preRouter.unwrapOrThrow()

    const onWrapperClean = () => {
      using _0 = registration
      using _1 = channel
      using _2 = router
    }

    using preWrapper = new Box(new Disposer(router, onWrapperClean))

    raw.port1.start()
    raw.port2.start()

    active.postMessage("HELLO_WORLD", [raw.port2])

    await Plume.waitOrSignal(router.events, "request", async (future: Future<void>, init: RpcRequestInit<any>) => {
      if (init.method !== "brume_hello")
        return new None()

      future.resolve()
      return new Some(Ok.void())
    }, AbortSignals.never())

    router.runPingLoop()

    const uuid = sessionStorage.getItem("uuid")
    const password = sessionStorage.getItem("password")

    if (uuid && password)
      await router.requestOrThrow({
        method: "brume_login",
        params: [uuid, password]
      }).then(r => r.unwrap())

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
    return await this.events.emit("request", [request])
  }

  async onResponse(port: RpcRouter, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", [response])
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.runAndDoubleWrap(() => this.requestOrThrow(init))
  }

  async requestOrThrow<T>(init: RpcRequestPreinit<unknown>): Promise<RpcResponse<T>> {
    const port = await this.ports.getOrThrow(0).then(r => r.unwrap().inner.inner.inner)

    return await port.requestOrThrow<T>(init)
  }

}

export function createWorkerPortPool(background: WorkerBackground): Pool<Disposer<WebsiteRpcRouter>> {
  return new Pool<Disposer<WebsiteRpcRouter>>(async (params) => {
    const { pool, index } = params

    const raw = new MessageChannel()

    const onRawClean = () => {
      raw.port1.close()
      raw.port2.close()
    }

    using preWorker = new Box(new Disposer(new Worker("/service_worker.js"), w => w.terminate()))
    using preChannel = new Box(new Disposer(raw, onRawClean))
    using preRouter = new Box(new WebsiteRpcRouter("background", raw.port1))

    const worker = preWorker.unwrapOrThrow()
    const channel = preChannel.unwrapOrThrow()
    const router = preRouter.unwrapOrThrow()

    const onWrapperClean = () => {
      using _0 = worker
      using _1 = channel
      using _2 = router
    }

    using preWrapper = new Box(new Disposer(router, onWrapperClean))

    raw.port1.start()
    raw.port2.start()

    worker.get().postMessage("HELLO_WORLD", [raw.port2])

    await Plume.waitOrSignal(router.events, "request", async (future: Future<void>, init: RpcRequestInit<any>) => {
      if (init.method !== "brume_hello")
        return new None()

      future.resolve()
      return new Some(Ok.void())
    }, AbortSignals.never())

    router.runPingLoop()

    const uuid = sessionStorage.getItem("uuid")
    const password = sessionStorage.getItem("password")

    if (uuid != null && password != null)
      await router.requestOrThrow({
        method: "brume_login",
        params: [uuid, password]
      }).then(r => r.unwrap())

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
    return await this.events.emit("request", [request])
  }

  async onResponse(port: RpcRouter, response: RpcResponseInit<unknown>) {
    return await this.events.emit("response", [response])
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

    if (isSafariExt())
      await BrowserError.runOrThrow(() => (browser.runtime.getBackgroundPage as any)())

    const raw = BrowserError.runOrThrowSync(() => {
      const port = browser.runtime.connect({ name: "foreground" })
      port.onDisconnect.addListener(() => void chrome.runtime.lastError)
      return port
    })

    using preChannel = new Box(new Disposer(raw, () => raw.disconnect()))
    using preRouter = new Box(new ExtensionRpcRouter("background", raw))

    await preRouter.getOrThrow().requestOrThrow<string>({
      method: "brume_ping"
    }, AbortSignal.timeout(1000)).then(r => r.unwrap())

    const channel = preChannel.unwrapOrThrow()
    const router = preRouter.unwrapOrThrow()

    const onInnerClean = () => {
      using _0 = channel
      using _1 = router
    }

    using preWrapper = new Box(new Disposer(router, onInnerClean))

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