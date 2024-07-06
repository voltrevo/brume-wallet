import { Future } from "@hazae41/future";
import { Signals } from "@hazae41/signals";

export namespace Sockets {

  export async function waitOrThrow(socket: WebSocket, signal = Signals.never()) {
    const future = new Future<void>()

    const onOpen = () => future.resolve()
    const onError = (e: unknown) => future.reject(e)
    const onClose = (e: unknown) => future.reject(e)
    const onAbort = (e: unknown) => future.reject(e)

    try {
      socket.addEventListener("open", onOpen, { passive: true })
      socket.addEventListener("close", onClose, { passive: true })
      socket.addEventListener("error", onError, { passive: true })
      signal.addEventListener("abort", onAbort, { passive: true })

      return await future.promise
    } finally {
      socket.removeEventListener("open", onOpen,)
      socket.removeEventListener("close", onClose)
      socket.removeEventListener("error", onError)
      signal.removeEventListener("abort", onAbort)
    }
  }

}