import { ChainData } from "@/libs/ethereum/mods/chain"
import { Maps } from "@/libs/maps/maps"
import { TorRpc } from "@/libs/rpc/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Fail, Fetched, FetcherMore } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Option } from "@hazae41/option"
import { Catched, Panic } from "@hazae41/result"
import { EthBrume } from "./entities/brumes/data"
import { EthereumFetchParams, WalletData } from "./entities/wallets/data"

export interface BgEthereumContext {
  readonly chain: ChainData
  readonly wallet: WalletData
  readonly brume: EthBrume
}

export namespace BgEthereumContext {

  export async function fetchOrFail<T>(ethereum: BgEthereumContext, init: RpcRequestPreinit<unknown> & EthereumFetchParams, more: FetcherMore = {}) {
    try {
      const { signal: parentSignal } = more
      const { brume } = ethereum

      const pools = Option.unwrap(brume[ethereum.chain.chainId])

      async function runWithPoolOrThrow(index: number) {
        const poolSignal = AbortSignals.timeout(5_000, parentSignal)
        const pool = await pools.tryGet(index, poolSignal).then(r => r.unwrap().unwrap().inner.inner)

        async function runWithConnOrThrow(index: number) {
          const connSignal = AbortSignals.timeout(5_000, parentSignal)
          const conn = await pool.tryGet(index, connSignal).then(r => r.unwrap().unwrap().inner.inner)

          const { counter, connection } = conn
          const request = counter.prepare(init)

          if (connection.isURL()) {
            const { url, circuit } = connection
            const signal = AbortSignals.timeout(10_000, parentSignal)

            const result = await TorRpc.tryFetchWithCircuit<T>(url, { ...request, circuit, signal })

            if (result.isErr())
              console.debug(`Could not fetch ${init.method} from ${url.href} using ${circuit.id}`, { result })

            return Fetched.rewrap(result.unwrap())
          }

          if (connection.isWebSocket()) {
            await connection.cooldown

            const { socket, circuit } = connection
            const signal = AbortSignals.timeout(10_000, parentSignal)

            const result = await TorRpc.tryFetchWithSocket<T>(socket, request, signal)

            if (result.isErr())
              console.debug(`Could not fetch ${init.method} from ${socket.url} using ${circuit.id}`, { result })

            return Fetched.rewrap(result.unwrap())
          }

          throw new Panic()
        }

        const promises = Array.from({ length: pool.capacity }, (_, i) => runWithConnOrThrow(i))

        const results = await Promise.allSettled(promises)

        const fetcheds = new Map<string, Fetched<T, Error>>()
        const counters = new Map<string, number>()

        for (const result of results) {
          if (result.status === "rejected")
            continue
          if (result.value.isErr())
            continue
          if (init?.noCheck)
            return result.value
          const raw = JSON.stringify(result.value.inner)
          const previous = Option.wrap(counters.get(raw)).unwrapOr(0)
          counters.set(raw, previous + 1)
          fetcheds.set(raw, result.value)
        }

        /**
         * One truth -> return it
         * Zero truth -> throw AggregateError
         */
        if (counters.size < 2)
          return await Promise.any(promises)

        console.warn(`Different results from multiple connections for ${init.method} on ${ethereum.chain.name}`, { fetcheds })

        /**
         * Sort truths by occurence
         */
        const sorteds = [...Maps.entries(counters)].sort((a, b) => b.value - a.value)

        /**
         * Two concurrent truths
         */
        if (sorteds[0].value === sorteds[1].value) {
          console.warn(`Could not choose truth for ${init.method} on ${ethereum.chain.name}`)
          const random = Math.round(Math.random())
          return fetcheds.get(sorteds[random].key)!
        }

        return fetcheds.get(sorteds[0].key)!
      }

      const promises = Array.from({ length: pools.capacity }, (_, i) => runWithPoolOrThrow(i))

      const results = await Promise.allSettled(promises)

      const fetcheds = new Map<string, Fetched<T, Error>>()
      const counters = new Map<string, number>()

      for (const result of results) {
        if (result.status === "rejected")
          continue
        if (result.value.isErr())
          continue
        if (init?.noCheck)
          return result.value
        const raw = JSON.stringify(result.value.inner)
        const previous = Option.wrap(counters.get(raw)).unwrapOr(0)
        counters.set(raw, previous + 1)
        fetcheds.set(raw, result.value)
      }

      /**
       * One truth -> return it
       * Zero truth -> throw AggregateError
       */
      if (counters.size < 2)
        return await Promise.any(promises)

      console.warn(`Different results from multiple circuits for ${init.method} on ${ethereum.chain.name}`, { fetcheds })

      /**
       * Sort truths by occurence
       */
      const sorteds = [...Maps.entries(counters)].sort((a, b) => b.value - a.value)

      /**
       * Two concurrent truths
       */
      if (sorteds[0].value === sorteds[1].value) {
        console.warn(`Could not choose truth for ${init.method} on ${ethereum.chain.name}`)
        const random = Math.round(Math.random())
        return fetcheds.get(sorteds[random].key)!
      }

      return fetcheds.get(sorteds[0].key)!
    } catch (e: unknown) {
      return new Fail(Catched.from(e))
    }
  }

}