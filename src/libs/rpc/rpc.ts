import { Future } from "@hazae41/future"
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume"
import { Err, Ok, Panic, Result } from "@hazae41/result"
import { RpcErr, RpcError } from "./err"
import { RpcRequestInit, RpcRequestPreinit } from "./request"
import { RpcResponse } from "./response"

export class RpcClient {

  #id = 0

  constructor() { }

  get id() {
    return this.#id
  }

  create<T>(init: RpcRequestPreinit<T>): RpcRequestInit<T> {
    const { method, params } = init

    const id = this.#id++

    return { jsonrpc: "2.0", id, method, params } as RpcRequestInit<T>
  }

  async fetch<T>(input: RequestInfo | URL, init: RpcRequestPreinit<unknown> & RequestInit) {
    const { method, params, ...rest } = init

    const request = this.create({ method, params })
    return Rpc.fetch<T>(input, { ...rest, ...request })
  }

  async tryFetchWithSocket<T>(socket: WebSocket, request: RpcRequestPreinit<unknown>, signal: AbortSignal) {
    return await Rpc.tryFetchWithSocket<T>(socket, this.create(request), signal)
  }

}

export namespace Rpc {

  export async function fetch<T>(input: RequestInfo | URL, init: RequestInit & RpcRequestInit<unknown>) {
    const { jsonrpc, id, method, params, ...rest } = init

    const headers = new Headers(rest.headers)
    headers.set("Content-Type", "application/json")

    const request = { jsonrpc, id, method, params }
    const body = JSON.stringify(request)

    const res = await globalThis.fetch(input, { ...init, headers, body })

    if (!res.ok) {
      const error = new RpcError(await res.text())
      return new RpcErr(request.id, error)
    }

    const response = RpcResponse.from<T>(await res.json())

    if (response.id !== request.id)
      return new Err(new Panic(`Invalid response ID`))

    return response
  }

  export async function tryFetchWithSocket<T>(socket: WebSocket, request: RpcRequestInit<unknown>, signal: AbortSignal) {
    socket.send(JSON.stringify(request))

    const future = new Future<Result<RpcResponse<T>, ClosedError | ErroredError | AbortedError>>()

    const onMessage = async (event: Event) => {
      const msgEvent = event as MessageEvent<string>
      const response = RpcResponse.from<T>(JSON.parse(msgEvent.data))

      if (response.id !== request.id)
        return
      future.resolve(new Ok(response))
    }

    const onError = (e: unknown) => {
      const result = new Err(ErroredError.from(e))
      future.resolve(result)
    }

    const onClose = (e: unknown) => {
      const result = new Err(ClosedError.from(e))
      future.resolve(result)
    }

    const onAbort = () => {
      socket.close()
      const result = new Err(AbortedError.from(signal.reason))
      future.resolve(result)
    }

    try {
      socket.addEventListener("message", onMessage, { passive: true })
      socket.addEventListener("close", onClose, { passive: true })
      socket.addEventListener("error", onError, { passive: true })
      signal.addEventListener("abort", onAbort, { passive: true })

      return await future.promise
    } finally {
      socket.removeEventListener("message", onMessage)
      socket.removeEventListener("close", onClose)
      socket.removeEventListener("error", onError)
      signal.removeEventListener("abort", onAbort)
    }
  }

}