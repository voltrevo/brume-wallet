import { AutoPool } from "@/libs/pool"
import { Opaque, Writable } from "@hazae41/binary"
import { Box, Deferred, Stack } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { Circuit } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { Result } from "@hazae41/result"
import { Circuits } from "../circuits/circuits"

export type Stream = Disposer<Mutex<ReadableWritablePair<Opaque, Writable>>>

export namespace Streams {

  export function createStreamPool(circuits: AutoPool<Circuit>, url: URL, size: number) {
    let update = Date.now()

    const pool = new AutoPool<Stream>(async (params) => {
      const { index, signal } = params

      while (!signal.aborted) {
        const start = Date.now()

        const result = await Result.runAndWrap(async () => {
          using precircuit = new Box(await circuits.takeCryptoRandomOrThrow(signal))
          using prestream = new Box(await Circuits.openAsOrThrow(precircuit.getOrThrow(), url.origin))

          const inputer = new TransformStream<Opaque, Opaque>({})
          const outputer = new TransformStream<Writable, Writable>({})

          const inner = {
            readable: outputer.readable,
            writable: inputer.writable
          } as const

          const outer = {
            readable: inputer.readable,
            writable: outputer.writable
          } as const

          const watcher = { inner, outer } as const

          const circuit = precircuit.moveOrThrow()
          const stream = prestream.moveOrThrow()

          const onResourceClean = () => {
            using postcircuit = circuit
            using poststream = stream
          }

          using preresource = new Box(new Disposer(new Mutex(watcher.outer), onResourceClean))

          let cleaned = false

          const onCloseOrError = async () => {
            if (cleaned)
              return
            pool.restart(index)
          }

          stream.inner.inner.readable.pipeTo(watcher.inner.writable).then(onCloseOrError).catch(onCloseOrError)
          watcher.inner.readable.pipeTo(stream.inner.inner.writable).then(onCloseOrError).catch(onCloseOrError)

          const resource = preresource.moveOrThrow()

          const onEntryClean = () => {
            using postresource = resource
            cleaned = true
          }

          return new Disposer(resource, onEntryClean)
        })

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }

      throw new Error("Aborted", { cause: signal.reason })
    }, size)

    const onStarted = () => {
      update = Date.now()

      for (const entry of pool.errEntries)
        pool.restart(entry.index)

      return
    }

    const stack = new Stack()

    stack.push(new Deferred(circuits.events.on("started", onStarted, { passive: true })))

    return new Disposer(pool, () => stack[Symbol.dispose]())
  }

}