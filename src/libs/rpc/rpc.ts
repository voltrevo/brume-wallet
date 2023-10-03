import { Bytes } from "@hazae41/bytes"
import { Circuit, CircuitOpenParams } from "@hazae41/echalote"
import { Future } from "@hazae41/future"
import { RpcRequest, RpcRequestInit, RpcResponse } from "@hazae41/jsonrpc"
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume"
import { Err, Ok, Result } from "@hazae41/result"

export namespace TorRpc {

  export async function tryFetchWithCircuit<T>(input: RequestInfo | URL, init: RequestInit & RpcRequestInit<unknown> & { circuit: Circuit } & CircuitOpenParams): Promise<Result<RpcResponse<T>, Error>> {
    const { id, method, params, circuit, ...rest } = init

    const request = new RpcRequest(id, method, params)
    const body = Bytes.fromUtf8(JSON.stringify(request))

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

    socket.send(JSON.stringify(new RpcRequest(id, method, params)))

    const future = new Future<Result<RpcResponse<T>, ClosedError | ErroredError | AbortedError>>()

    const onMessage = async (event: MessageEvent<unknown>) => {
      if (typeof event.data !== "string")
        return
      const response = RpcResponse.from<T>(JSON.parse(event.data))

      if (response.id !== request.id)
        return
      future.resolve(new Ok(response))
    }

    const onError = (e: unknown) => {
      future.resolve(new Err(ErroredError.from(e)))
    }

    const onClose = (e: unknown) => {
      future.resolve(new Err(ClosedError.from(e)))
    }

    const onAbort = () => {
      future.resolve(new Err(AbortedError.from(signal.reason)))
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