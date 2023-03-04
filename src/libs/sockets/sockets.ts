import { Future } from "@hazae41/future";

export namespace Sockets {

  export async function waitFor<T>(event: string, params: {
    socket: WebSocket,
    future: Future<T>,
    onEvent: (event: Event) => void,
    signal?: AbortSignal
  }) {
    const { socket, future, onEvent, signal } = params

    try {
      signal?.addEventListener("abort", future.reject)
      socket.addEventListener("error", future.reject)
      socket.addEventListener("close", future.reject)
      socket.addEventListener(event, onEvent)

      return await future.promise
    } finally {
      signal?.removeEventListener("abort", future.reject)
      socket.removeEventListener("error", future.reject)
      socket.removeEventListener("close", future.reject)
      socket.removeEventListener(event, onEvent)
    }
  }

}