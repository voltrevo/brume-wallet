import { SafeJson } from "@/libs/wconn/mods/json/json";
import { Future } from "@hazae41/future";
import { RpcRequest, RpcRequestPreinit, RpcResponse } from "@hazae41/jsonrpc";
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume";

export namespace SafeRpc {

  export function prepare<T>(init: RpcRequestPreinit<T>): RpcRequest<T> {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    return new RpcRequest(id, init.method, init.params)
  }

  export async function requestOrThrow<T>(socket: WebSocket, init: RpcRequestPreinit<unknown>, signal: AbortSignal) {
    const request = prepare(init)

    socket.send(SafeJson.stringify(request))

    const future = new Future<RpcResponse<T>>()

    const onMessage = async (event: MessageEvent<unknown>) => {
      if (typeof event.data !== "string")
        return
      const response = RpcResponse.from<T>(SafeJson.parse(event.data))

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

      return await future.promise
    } finally {
      socket.removeEventListener("message", onMessage)
      socket.removeEventListener("close", onClose)
      socket.removeEventListener("error", onError)
      signal.removeEventListener("abort", onAbort)
    }

  }

}