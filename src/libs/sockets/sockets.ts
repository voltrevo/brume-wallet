import { Future } from "@hazae41/future";
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume";
import { Err, Ok, Result } from "@hazae41/result";

export namespace Sockets {

  export async function tryWaitOpen(socket: WebSocket, signal: AbortSignal) {
    const future = new Future<Result<void, ClosedError | ErroredError | AbortedError>>()

    const onOpen = () => {
      const result = Ok.void()
      future.resolve(result)
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