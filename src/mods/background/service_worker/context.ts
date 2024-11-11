import { ChainData } from "@/libs/ethereum/mods/chain"
import { Maps } from "@/libs/maps/maps"
import { ping } from "@/libs/ping"
import { TorRpc } from "@/libs/rpc/rpc"
import { Fail, Fetched, FetcherMore } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Option } from "@hazae41/option"
import { Catched, Result } from "@hazae41/result"
import { EthBrume } from "./entities/brumes/data"
import { EthereumFetchParams } from "./entities/wallets/data"

export interface BgEthereumContext {
  readonly chain: ChainData
  readonly brume: EthBrume
}

export namespace BgEthereumContext {

  export async function fetchOrFail<T>(ethereum: BgEthereumContext, init: RpcRequestPreinit<unknown> & EthereumFetchParams, more: FetcherMore = {}) {
    try {
      const { signal: parentSignal = new AbortController().signal } = more
      const { brume } = ethereum

      const circuits = Option.wrap(brume[ethereum.chain.chainId]).getOrThrow()
      const circuit = await circuits.get().getCryptoRandomOrThrow(parentSignal)

      async function runWithTargetOrThrow(index: number) {
        const target = await Result.runAndWrap(() => circuit.get().getOrThrow(index, parentSignal))
          .then(r => r.inspectErrSync(e => console.warn(`Failed to get target ${index} for ${init.method} on ${ethereum.chain.name}`, e)))
          .then(r => r.getOrThrow())

        const { counter, connection } = target
        const request = counter.prepare(init)

        if (connection.isURL()) {
          const { url, circuit } = connection

          const signal = AbortSignal.any([AbortSignal.timeout(ping.value * 3), parentSignal])
          const response = await TorRpc.fetchWithCircuitOrThrow<T>(url, { ...request, circuit, signal })

          if (response.isOk())
            console.log(`Fetched ${request.method} on ${ethereum.chain.name}`, response)

          if (response.isErr())
            console.error(`Failed to fetch ${request.method} on ${ethereum.chain.name}`, response)

          return Fetched.rewrap(response)
        }

        if (connection.isWebSocket()) {
          const { socket, cooldown } = connection

          await cooldown

          const signal = AbortSignal.any([AbortSignal.timeout(ping.value * 3), parentSignal])
          const response = await TorRpc.fetchWithSocketOrThrow<T>(socket, request, signal)

          if (response.isOk())
            console.log(`Fetched ${request.method} on ${ethereum.chain.name}`, response)

          if (response.isErr())
            console.error(`Failed to fetch ${request.method} on ${ethereum.chain.name}`, response)

          return Fetched.rewrap(response)
        }

        return connection satisfies never
      }

      const promises = Array.from({ length: circuit.get().size }, (_, i) => runWithTargetOrThrow(i))

      const results = await Promise.allSettled(promises)

      const fetcheds = new Map<string, Fetched<T, Error>>()
      const counters = new Map<string, number>()

      for (const result of results) {
        console.log(result)
        if (result.status === "rejected")
          continue
        if (result.value.isErr())
          continue
        if (init?.noCheck)
          return result.value
        const raw = JSON.stringify(result.value.inner)
        const previous = Option.wrap(counters.get(raw)).getOr(0)
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
    } catch (e: unknown) {
      return new Fail(Catched.wrap(e))
    }
  }

}

