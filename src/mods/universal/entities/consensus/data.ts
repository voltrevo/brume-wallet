import { Circuit, Consensus, TorClientDuplex } from "@hazae41/echalote"
import { createQuery, Data, Fail, FetcherMore, Storage } from "@hazae41/glacier"
import { Nullable, Option } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { Signals } from "@hazae41/signals"

export namespace MicrodescQuery {

  export namespace All {

    export type K = string
    export type D = Consensus.Microdesc.Head[]
    export type F = Error

    export const key = `microdescs`

    export function create(maybeTor: Nullable<TorClientDuplex>, storage: Storage) {
      const fetcher = async (_: K, more: FetcherMore) => {
        try {
          const { signal } = more

          let start

          const tor = Option.unwrap(maybeTor)

          start = Date.now()
          const subsignal = Signals.merge(AbortSignal.timeout(2000), signal)
          using circuit = await tor.createOrThrow(subsignal)
          console.log(`Created consensus circuit in ${Date.now() - start}ms`)

          start = Date.now()
          const subsignal2 = Signals.merge(AbortSignal.timeout(20_000), signal)
          const consensus = await Consensus.fetchOrThrow(circuit, subsignal2)
          console.log(`Fetched consensus in ${Date.now() - start}ms`)

          const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000
          const cooldown = Date.now() + 1 * 24 * 60 * 60 * 1000

          return new Data(consensus.microdescs, { expiration, cooldown })
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      return createQuery<K, D, F>({ key, fetcher, storage })
    }

  }

  export type K = string
  export type D = Consensus.Microdesc
  export type F = Error

  export function key(head: Consensus.Microdesc.Head) {
    return `microdesc/${head.identity}`
  }

  export function create(head: Nullable<Consensus.Microdesc.Head>, index: number, maybeCircuit: Nullable<Circuit>, storage: Storage) {
    if (head == null)
      return

    const fetcher = async (_: K, more: FetcherMore) => {
      try {
        const { signal } = more

        let start

        const circuit = Option.unwrap(maybeCircuit)

        start = Date.now()
        const subsignal = Signals.merge(AbortSignal.timeout(1000), signal)
        const microdesc = await Consensus.Microdesc.fetchOrThrow(circuit, head, subsignal)
        console.log(`Fetched microdesc #${index} in ${Date.now() - start}ms`)

        const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000
        const cooldown = Date.now() + 1 * 24 * 60 * 60 * 1000

        return new Data(microdesc, { expiration, cooldown })
      } catch (e: unknown) {
        return new Fail(Catched.wrap(e))
      }
    }

    return createQuery<K, D, F>({ key: key(head), fetcher, storage })
  }

}