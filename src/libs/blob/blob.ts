import { Future } from "@hazae41/future"
import { Err, Ok, Result } from "@hazae41/result"

export namespace Blobs {

  export async function toData(blob: Blob) {
    const future = new Future<Result<string, Error>>()

    const reader = new FileReader()

    const onLoadEnd = () => {
      future.resolve(new Ok(reader.result as string))
    }

    const onError = () => {
      future.resolve(new Err(reader.error as DOMException))
    }

    const onAbort = () => {
      future.resolve(new Err(new Error(`Aborted`)))
    }

    try {
      reader.addEventListener("loadend", onLoadEnd, { passive: true })
      reader.addEventListener("error", onError, { passive: true })
      reader.addEventListener("abort", onAbort, { passive: true })

      reader.readAsDataURL(blob)

      return await future.promise
    } finally {
      reader.removeEventListener("loadend", onLoadEnd)
      reader.removeEventListener("error", onError)
      reader.removeEventListener("abort", onAbort)
    }

  }

}