import { Future } from "@hazae41/future"
import { AbortError, CloseError, ErrorError } from "@hazae41/plume"
import { Err, Ok, Result } from "@hazae41/result"
import { RpcRequest, RpcRequestInit } from "./request"
import { Response } from "./response"

export * from "./request"
export * from "./response"

export class Client {

  #id = 0

  constructor() { }

  get id() {
    return this.#id
  }

  new<T extends unknown[] = unknown[]>(init: RpcRequestInit<T>) {
    const { method, params } = init

    const id = this.#id++

    return { jsonrpc: "2.0", id, method, params } satisfies RpcRequest<T>
  }

  async fetch<T>(input: RequestInfo | URL, init: RequestInit & RpcRequestInit) {
    const { method, params, ...rest } = init

    const request = this.new({ method, params })
    return fetch<T>(input, { ...rest, ...request })
  }

  async tryFetchWithSocket<T>(socket: WebSocket, request: RpcRequestInit, signal: AbortSignal) {
    return await tryFetchWithSocket<T>(socket, this.new(request), signal)
  }

}

export async function fetch<T>(input: RequestInfo | URL, init: RequestInit & RpcRequest) {
  const { jsonrpc, id, method, params, ...rest } = init

  const headers = new Headers(rest.headers)
  headers.set("Content-Type", "application/json")

  const request = { jsonrpc, id, method, params }
  const body = JSON.stringify(request)

  const res = await globalThis.fetch(input, { ...init, headers, body })

  if (!res.ok) {
    const error = new Error(await res.text())
    return new Response.RpcErr(request.id, error)
  }

  const response = Response.from<T>(await res.json())

  if (response.id !== request.id) {
    const error = new Error(`Invalid response ID`)
    return new Response.RpcErr(request.id, error)
  }

  return response
}

export async function tryFetchWithSocket<T>(socket: WebSocket, request: RpcRequest, signal: AbortSignal) {
  socket.send(JSON.stringify(request))

  const future = new Future<Result<Response<T>, CloseError | ErrorError | AbortError>>()

  const onMessage = async (event: Event) => {
    const msgEvent = event as MessageEvent<string>
    const response = Response.from<T>(JSON.parse(msgEvent.data))

    if (response.id !== request.id)
      return
    future.resolve(new Ok(response))
  }

  const onError = (e: unknown) => {
    const result = new Err(ErrorError.from(e))
    future.resolve(result)
  }

  const onClose = (e: unknown) => {
    const result = new Err(CloseError.from(e))
    future.resolve(result)
  }

  const onAbort = () => {
    socket.close()
    const result = new Err(AbortError.from(signal.reason))
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
