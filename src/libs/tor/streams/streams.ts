import { Results } from "@/libs/results/results"
import { Opaque, Writable } from "@hazae41/binary"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/cleaner"
import { Circuit } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { None } from "@hazae41/option"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"
import { Circuits } from "../circuits/circuits"

export type Stream = Disposer<Mutex<ReadableWritablePair<Opaque, Writable>>>

export namespace Streams {

  export function createStreamPool(url: URL, circuits: Mutex<Pool<Circuit>>, params: PoolParams) {
    let update = Date.now()

    const pool = new Pool<Stream>(async (params) => {
      const { pool, index, signal } = params

      while (true) {
        const start = Date.now()

        const result = await Result.unthrow<Result<Disposer<Box<Stream>>, Error>>(async t => {
          using precircuit = await Pool.tryTakeCryptoRandom(circuits).then(r => r.throw(t).throw(t).inner)
          using prestream = new Box(await Circuits.tryOpenAs(precircuit.inner, url.origin).then(r => r.throw(t)))

          const circuit = precircuit.moveOrThrow()
          const stream = prestream.moveOrThrow()

          const onResourceClean = () => {
            stream[Symbol.dispose]()
            circuit[Symbol.dispose]()
          }

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

          let cleaned = false

          const onEntryClean = () => {
            cleaned = true
          }

          const onCloseOrError = async () => {
            if (cleaned) return
            pool.restart(index)
            return new None()
          }

          stream.inner.inner.readable.pipeTo(watcher.inner.writable, { signal, preventCancel: true }).then(onCloseOrError).catch(onCloseOrError)
          watcher.inner.readable.pipeTo(stream.inner.inner.writable, { signal, preventAbort: true, preventClose: true }).then(onCloseOrError).catch(onCloseOrError)

          using resource = new Box(new Disposer(new Mutex(watcher.outer), onResourceClean))

          return new Ok(new Disposer(resource.moveOrThrow(), onEntryClean))
        }).then(Results.log)

        if (result.isOk())
          return result

        if (start < update)
          continue

        return result
      }
    }, params)

    circuits.inner.events.on("started", async () => {
      update = Date.now()

      for (let i = 0; i < pool.capacity; i++) {
        const child = pool.tryGetSync(i)

        if (child.isErr())
          continue

        if (child.inner.isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }, { passive: true })

    return new Mutex(pool)
  }

}