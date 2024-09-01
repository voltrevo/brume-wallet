import { Maps } from "@/libs/maps/maps"
import { NetworkParams } from "@/libs/network/network"
import { ping } from "@/libs/ping"
import { TorRpc } from "@/libs/rpc/rpc"
import { randomUUID } from "@/libs/uuid/uuid"
import { Arrays } from "@hazae41/arrays"
import { ZeroHexString } from "@hazae41/cubane"
import { Fail, Fetched, FetcherMore, IDBStorage, createQuery } from "@hazae41/glacier"
import { RpcCounter, RpcRequestPreinit } from "@hazae41/jsonrpc"
import { NetworkMixin, base16_decode_mixed, base16_encode_lower, initBundledOnce } from "@hazae41/network-bundle"
import { Option } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { BgEthereumContext } from "../../context"
import { EthereumFetchParams, EthereumQueryKey } from "../wallets/data"

export interface SimulationData {
  readonly type: ZeroHexString
  readonly status: boolean

  readonly blockNumber: ZeroHexString

  readonly gasUsed: ZeroHexString
  readonly cumulativeGasUsed: ZeroHexString

  readonly logs: readonly LogData[]
  readonly logsBloom: ZeroHexString

  readonly trace: readonly unknown[]

  readonly assetChanges: readonly unknown[]
  readonly balanceChanges: readonly unknown[]
}


export interface LogData {
  readonly name: string
  readonly anonymous: boolean

  readonly inputs: readonly LogInputData[]

  readonly raw: {
    readonly address: ZeroHexString
    readonly topics: readonly ZeroHexString[]
    readonly data: ZeroHexString
  }
}

export interface LogInputData {
  readonly name: string
  readonly type: string
  readonly indexed: boolean
  readonly value: unknown
}

export namespace BgSimulation {

  export type K = EthereumQueryKey<unknown> & EthereumFetchParams
  export type D = SimulationData
  export type F = Error

  async function generateOrThrow(params: NetworkParams) {
    const { chainIdString, contractZeroHex, receiverZeroHex, nonceZeroHex, minimumZeroHex } = params

    await initBundledOnce()

    const chainIdBase16 = Number(chainIdString).toString(16).padStart(64, "0")
    const chainIdMemory = base16_decode_mixed(chainIdBase16)

    const contractBase16 = contractZeroHex.slice(2).padStart(64, "0")
    const contractMemory = base16_decode_mixed(contractBase16)

    const receiverBase16 = receiverZeroHex.slice(2).padStart(64, "0")
    const receiverMemory = base16_decode_mixed(receiverBase16)

    const nonceBase16 = nonceZeroHex.slice(2).padStart(64, "0")
    const nonceMemory = base16_decode_mixed(nonceBase16)

    const mixinStruct = new NetworkMixin(chainIdMemory, contractMemory, receiverMemory, nonceMemory)

    const minimumBase16 = minimumZeroHex.slice(2).padStart(64, "0")
    const minimumMemory = base16_decode_mixed(minimumBase16)

    const generatedStruct = mixinStruct.generate(minimumMemory)

    const secretMemory = generatedStruct.to_secret()
    const secretBase16 = base16_encode_lower(secretMemory)
    const secretZeroHex = `0x${secretBase16}`

    return secretZeroHex
  }

  export async function fetchOrFail<T>(ethereum: BgEthereumContext, init: RpcRequestPreinit<unknown> & EthereumFetchParams, more: FetcherMore = {}) {
    try {
      const { signal: parentSignal = new AbortController().signal } = more
      const { brume } = ethereum

      const circuits = brume.circuits

      async function runWithCircuitOrThrow(index: number) {
        const circuitSignal = AbortSignal.any([AbortSignal.timeout(ping.value * 5), parentSignal])
        const circuit = await circuits.getOrThrow(index, circuitSignal)

        const session = randomUUID()

        const url = new URL(`https://signal.node0.hazae41.me`)
        url.searchParams.set("session", session)

        const params = await TorRpc.fetchWithCircuitOrThrow<NetworkParams>(url, {
          circuit,
          signal: AbortSignal.any([AbortSignal.timeout(ping.value * 5), parentSignal]),
          ...new RpcCounter().prepare({ method: "net_get" }),
        }).then(r => r.getOrThrow())

        const secret = await generateOrThrow(params)

        await TorRpc.fetchWithCircuitOrThrow<void>(url, {
          circuit,
          signal: AbortSignal.any([AbortSignal.timeout(ping.value * 5), parentSignal]),
          ...new RpcCounter().prepare({ method: "net_tip", params: [secret] })
        }).then(r => r.getOrThrow())

        const nodes = await TorRpc.fetchWithCircuitOrThrow<{ location: string }[]>(url, {
          circuit,
          signal: AbortSignal.any([AbortSignal.timeout(ping.value * 5), parentSignal]),
          ...new RpcCounter().prepare({ method: "net_search", params: [{}, { protocols: [`https:json-rpc:(pay-by-char|tenderly:${ethereum.chain.chainId})`] }] })
        }).then(r => r.getOrThrow())

        const node = Arrays.cryptoRandom(nodes)

        if (node == null)
          throw new Error(`No node found for ${ethereum.chain.name}`)

        {
          const url = new URL(`${node.location}`)
          url.searchParams.set("session", session)

          const params = await TorRpc.fetchWithCircuitOrThrow<NetworkParams>(url, {
            circuit,
            signal: AbortSignal.any([AbortSignal.timeout(ping.value * 5), parentSignal]),
            ...new RpcCounter().prepare({ method: "net_get" }),
          }).then(r => r.getOrThrow())

          const secret = await generateOrThrow(params)

          await TorRpc.fetchWithCircuitOrThrow<void>(url, {
            circuit,
            signal: AbortSignal.any([AbortSignal.timeout(ping.value * 5), parentSignal]),
            ...new RpcCounter().prepare({ method: "net_tip", params: [secret] })
          }).then(r => r.getOrThrow())

          return await TorRpc.fetchWithCircuitOrThrow<T>(url, {
            circuit,
            signal: AbortSignal.any([AbortSignal.timeout(ping.value * 5), parentSignal]),
            ...new RpcCounter().prepare(init)
          }).then(r => Fetched.rewrap(r))
        }
      }

      const random = await circuits.getRawCryptoRandomOrThrow()
      const promises = [runWithCircuitOrThrow(random.index)]

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
      return new Fail(Catched.wrap(e))
    }
  }

  export const method = "tenderly_simulateTransaction"

  export function key(chainId: number, tx: unknown, block: string) {
    return {
      chainId,
      method,
      params: [tx, block],
      noCheck: true
    }
  }

  export async function parseOrThrow(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
    const [tx, block] = (request as RpcRequestPreinit<[unknown, string]>).params

    return schema(ethereum, tx, block, storage)
  }

  export function schema(ethereum: BgEthereumContext, tx: unknown, block: string, storage: IDBStorage) {
    const fetcher = async (request: EthereumQueryKey<unknown> & EthereumFetchParams, more: FetcherMore) =>
      await fetchOrFail<SimulationData>(ethereum, request, more).then(r => r.inspectErrSync(e => console.error({ e },)))

    return createQuery<K, D, F>({
      key: key(ethereum.chain.chainId, tx, block),
      fetcher,
      storage
    })
  }

}