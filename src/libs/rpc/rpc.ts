import { Bytes } from "@hazae41/bytes"
import { Circuit, CircuitOpenParams } from "@hazae41/echalote"
import { fetch } from "@hazae41/fleche"
import { Future } from "@hazae41/future"
import { RpcRequest, RpcRequestInit, RpcResponse } from "@hazae41/jsonrpc"
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume"
import { Circuits } from "../tor/circuits/circuits"

export namespace TorRpc {

  export async function fetchWithCircuitOrThrow<T>(input: RequestInfo | URL, init: RequestInit & RpcRequestInit<unknown> & { circuit: Circuit } & CircuitOpenParams) {
    const { id, method, params, circuit, ...rest } = init

    const request = new RpcRequest(id, method, params)
    const body = Bytes.fromUtf8(JSON.stringify(request))

    const headers = new Headers(rest.headers)
    headers.set("Content-Type", "application/json")
    headers.set("Content-Length", `${body.length}`)

    using stream = await Circuits.openAsOrThrow(circuit, input)

    const res = await fetch(input, { ...rest, method: "POST", headers, body, stream: stream.inner })

    if (!res.ok)
      throw new Error(await res.text())

    const json = await res.json()
    const response = RpcResponse.from<T>(json)

    if (response.id !== request.id)
      console.warn(`Invalid response ID`, response.id, "expected", request.id)

    return response
  }

  export async function fetchWithSocketOrThrow<T>(socket: WebSocket, request: RpcRequestInit<unknown>, signal: AbortSignal) {
    const { id, method, params = [] } = request
    const future = new Future<RpcResponse<T>>()

    const onMessage = async (event: MessageEvent<unknown>) => {
      if (typeof event.data !== "string")
        return
      const response = RpcResponse.from<T>(JSON.parse(event.data))

      if (response.id !== request.id)
        return
      future.resolve(response)
    }

    const onError = (e: unknown) => {
      future.reject(ErroredError.from(e))
    }

    const onClose = (e: unknown) => {
      future.reject(ClosedError.from(e))
    }

    const onAbort = () => {
      future.reject(AbortedError.from(signal.reason))
    }

    try {
      socket.addEventListener("message", onMessage, { passive: true })
      socket.addEventListener("close", onClose, { passive: true })
      socket.addEventListener("error", onError, { passive: true })
      signal.addEventListener("abort", onAbort, { passive: true })

      socket.send(JSON.stringify(new RpcRequest(id, method, params)))

      return await future.promise
    } finally {
      socket.removeEventListener("message", onMessage)
      socket.removeEventListener("close", onClose)
      socket.removeEventListener("error", onError)
      signal.removeEventListener("abort", onAbort)
    }
  }

}