import { Fleche } from "@hazae41/fleche";
import { Future } from "../futures/future";

export namespace WebSockets {

  export async function waitFor<T>(socket: WebSocket | Fleche.WebSocket, params: {
    future: Future<T, unknown>,
    onEvent: (event: Event) => void,
    signal?: AbortSignal
  }) {
    const { future, onEvent, signal } = params

    try {
      signal?.addEventListener("abort", future.err)
      socket.addEventListener("error", future.err)
      socket.addEventListener("close", future.err)
      socket.addEventListener("message", onEvent)

      return await future.promise
    } finally {
      signal?.removeEventListener("abort", future.err)
      socket.removeEventListener("error", future.err)
      socket.removeEventListener("close", future.err)
      socket.removeEventListener("message", onEvent)
    }
  }

}