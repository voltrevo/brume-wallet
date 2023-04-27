import { Future } from "@hazae41/future";

export namespace Sockets {

  export interface WaitParams<T> {
    future: Future<T>,
    onEvent: (event: Event) => void,
    signal?: AbortSignal
  }

  export async function wait(socket: WebSocket, type: string, signal?: AbortSignal) {
    const future = new Future<Event>()
    const onEvent = (e: Event) => future.resolve(e)
    return await waitMap(socket, type, { future, onEvent, signal })
  }

  export async function waitMap<T>(socket: WebSocket, type: string, params: WaitParams<T>) {
    const { future, onEvent, signal } = params

    try {
      signal?.addEventListener("abort", future.reject)
      socket.addEventListener("error", future.reject)
      socket.addEventListener("close", future.reject)
      socket.addEventListener(type, onEvent)

      return await future.promise
    } finally {
      signal?.removeEventListener("abort", future.reject)
      socket.removeEventListener("error", future.reject)
      socket.removeEventListener("close", future.reject)
      socket.removeEventListener(type, onEvent)
    }
  }

}