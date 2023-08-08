import { Bytes } from "@hazae41/bytes"
import { Circuit, CircuitOpenParams } from "@hazae41/echalote"
import { Future } from "@hazae41/future"
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume"
import { Err, Ok, Result } from "@hazae41/result"
import { RpcRequest, RpcRequestInit, RpcRequestPreinit } from "./request"
import { RpcResponse } from "./response"

export class RpcClient {

  id = 0

  constructor() { }

  create<T>(init: RpcRequestPreinit<T>): RpcRequestInit<T> {
    const { method, params } = init

    const id = this.id++

    return { jsonrpc: "2.0", id, method, params } as RpcRequestInit<T>
  }

  async tryFetchWithCircuit<T>(input: RequestInfo | URL, init: RequestInit & RpcRequestPreinit<unknown> & { circuit: Circuit } & CircuitOpenParams) {
    const { method, params, ...rest } = init
    const request = this.create({ method, params })

    return Rpc.tryFetchWithCircuit<T>(input, { ...rest, ...request })
  }

  async tryFetchWithSocket<T>(socket: WebSocket, request: RpcRequestPreinit<unknown>, signal: AbortSignal) {
    return await Rpc.tryFetchWithSocket<T>(socket, this.create(request), signal)
  }

}

export namespace Rpc {

  export async function tryFetchWithCircuit<T>(input: RequestInfo | URL, init: RequestInit & RpcRequestInit<unknown> & { circuit: Circuit } & CircuitOpenParams): Promise<Result<RpcResponse<T>, Error>> {
    const { id, method, params, circuit, ...rest } = init

    const request = new RpcRequest(id, method, params)
    const body = Bytes.fromUtf8(request.toJSON())

    const headers = new Headers(rest.headers)
    headers.set("Content-Type", "application/json")
    headers.set("Content-Length", `${body.length}`)

    const res = await circuit.tryFetch(input, { ...rest, method: "POST", headers, body })

    if (!res.isOk())
      return res

    if (!res.inner.ok)
      return new Err(new Error(await res.inner.text()))

    const response = RpcResponse.from<T>(await res.inner.json())

    if (response.id !== request.id)
      console.warn(`Invalid response ID`, response.id, "expected", request.id)

    return new Ok(response)
  }

  export async function tryFetchWithSocket<T>(socket: WebSocket, request: RpcRequestInit<unknown>, signal: AbortSignal) {
    const { id, method, params = [] } = request

    socket.send(new RpcRequest(id, method, params).toJSON())

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