import { ping } from "@/libs/ping"
import { AbortSignals } from "@/libs/signals"
import { Circuit, Consensus, TorClientDuplex } from "@hazae41/echalote"
import { createQuery, Data, Fail, QueryStorage } from "@hazae41/glacier"
import { Nullable, Option } from "@hazae41/option"
import { Catched } from "@hazae41/result"

export namespace MicrodescQuery {

  export namespace All {

    export type K = string
    export type D = Consensus.Microdesc.Head[]
    export type F = Error

    export const key = `microdescs`

    export function route(cacheKey: string, storage: QueryStorage) {
      if (cacheKey !== key)
        return
      return create(undefined, storage)
    }

    export function create(maybeTor: Nullable<TorClientDuplex>, storage: QueryStorage) {
      const fetcher = async (_: K, init: RequestInit) => {
        try {
          const signal = AbortSignals.getOrNever(init.signal)

          let start

          const tor = Option.wrap(maybeTor).getOrThrow()

          start = Date.now()
          const subsignal = AbortSignal.any([AbortSignal.timeout(ping.value * 24), signal])
          using circuit = await tor.createOrThrow(subsignal)
          console.debug(`Created consensus circuit in ${Date.now() - start}ms`)

          start = Date.now()
          const subsignal2 = AbortSignal.any([AbortSignal.timeout(ping.value * 24), signal])
          const consensus = await Consensus.fetchOrThrow(circuit, subsignal2)
          console.debug(`Fetched consensus in ${Date.now() - start}ms`)

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 1)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

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

  export function key(identity: string) {
    return `microdesc/${identity}`
  }

  export function route(cacheKey: string, storage: QueryStorage) {
    if (!cacheKey.startsWith("microdesc/"))
      return
    const [identity] = cacheKey.split("/").slice(1)

    return create(identity, undefined, undefined, undefined, storage)
  }

  export function create(identity: string, maybeIndex: Nullable<number>, maybeHead: Nullable<Consensus.Microdesc.Head>, maybeCircuit: Nullable<Circuit>, storage: QueryStorage) {
    const fetcher = async (_: K, init: RequestInit) => {
      try {
        const signal = AbortSignals.getOrNever(init.signal)

        let start

        const index = Option.wrap(maybeIndex).getOrThrow()
        const head = Option.wrap(maybeHead).getOrThrow()
        const circuit = Option.wrap(maybeCircuit).getOrThrow()

        start = Date.now()
        const subsignal = AbortSignal.any([AbortSignal.timeout(ping.value * 9), signal])
        const microdesc = await Consensus.Microdesc.fetchOrThrow(circuit, head, subsignal)
        console.debug(`Fetched microdesc #${index} in ${Date.now() - start}ms`)

        const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 1)
        const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

        return new Data(microdesc, { expiration, cooldown })
      } catch (e: unknown) {
        return new Fail(Catched.wrap(e))
      }
    }

    return createQuery<K, D, F>({ key: key(identity), fetcher, storage })
  }

}