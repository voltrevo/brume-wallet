import { NetworkParams } from "@/libs/network/network"
import { ping } from "@/libs/ping"
import { TorRpc } from "@/libs/rpc/rpc"
import { AbortSignals } from "@/libs/signals"
import { randomUUID } from "@/libs/uuid/uuid"
import { Arrays } from "@hazae41/arrays"
import { ZeroHexString } from "@hazae41/cubane"
import { Fail, Fetched, QueryStorage, createQuery } from "@hazae41/glacier"
import { RpcCounter, RpcRequestPreinit } from "@hazae41/jsonrpc"
import { NetworkWasm } from "@hazae41/network.wasm"
import { Catched } from "@hazae41/result"
import { BgEthereumContext } from "../../context"
import { EthereumChainfulRpcRequestPreinit, EthereumChainlessRpcRequestPreinit } from "../wallets/data"

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

  export type K = EthereumChainfulRpcRequestPreinit<unknown>
  export type D = SimulationData
  export type F = Error

  async function generateOrThrow(params: NetworkParams) {
    const { chainIdString, contractZeroHex, receiverZeroHex, nonceZeroHex, minimumZeroHex } = params

    await NetworkWasm.initBundled()

    const chainIdBase16 = Number(chainIdString).toString(16).padStart(64, "0")
    const chainIdMemory = NetworkWasm.base16_decode_mixed(chainIdBase16)

    const contractBase16 = contractZeroHex.slice(2).padStart(64, "0")
    const contractMemory = NetworkWasm.base16_decode_mixed(contractBase16)

    const receiverBase16 = receiverZeroHex.slice(2).padStart(64, "0")
    const receiverMemory = NetworkWasm.base16_decode_mixed(receiverBase16)

    const nonceBase16 = nonceZeroHex.slice(2).padStart(64, "0")
    const nonceMemory = NetworkWasm.base16_decode_mixed(nonceBase16)

    const mixinStruct = new NetworkWasm.NetworkMixin(chainIdMemory, contractMemory, receiverMemory, nonceMemory)

    const minimumBase16 = minimumZeroHex.slice(2).padStart(64, "0")
    const minimumMemory = NetworkWasm.base16_decode_mixed(minimumBase16)

    const generatedStruct = mixinStruct.generate(minimumMemory)

    const secretMemory = generatedStruct.to_secret()
    const secretBase16 = NetworkWasm.base16_encode_lower(secretMemory)
    const secretZeroHex = `0x${secretBase16}`

    return secretZeroHex
  }

  export async function fetchOrFail<T>(context: BgEthereumContext, info: EthereumChainlessRpcRequestPreinit<unknown>, init: RequestInit = {}) {
    try {
      const presignal = AbortSignals.getOrNever(init.signal)

      const circuit = await context.brume.circuits.getCryptoRandomOrThrow(presignal)
      const session = randomUUID()

      const url = new URL(`https://signal.node0.hazae41.me`)
      url.searchParams.set("session", session)

      const params = await TorRpc.fetchWithCircuitOrThrow<NetworkParams>(url, {
        circuit,
        signal: AbortSignal.any([AbortSignal.timeout(ping.value * 9), presignal]),
        ...new RpcCounter().prepare({ method: "net_get" }),
      }).then(r => r.getOrThrow())

      const secret = await generateOrThrow(params)

      await TorRpc.fetchWithCircuitOrThrow<void>(url, {
        circuit,
        signal: AbortSignal.any([AbortSignal.timeout(ping.value * 9), presignal]),
        ...new RpcCounter().prepare({ method: "net_tip", params: [secret] })
      }).then(r => r.getOrThrow())

      const nodes = await TorRpc.fetchWithCircuitOrThrow<{ location: string }[]>(url, {
        circuit,
        signal: AbortSignal.any([AbortSignal.timeout(ping.value * 9), presignal]),
        ...new RpcCounter().prepare({ method: "net_search", params: [{}, { protocols: [`https:json-rpc:(pay-by-char|tenderly:${context.chain.chainId})`] }] })
      }).then(r => r.getOrThrow())

      const node = Arrays.cryptoRandom(nodes)

      if (node == null)
        throw new Error(`No node found for ${context.chain.name}`)

      {
        const url = new URL(`${node.location}`)
        url.searchParams.set("session", session)

        const params = await TorRpc.fetchWithCircuitOrThrow<NetworkParams>(url, {
          circuit,
          signal: AbortSignal.any([AbortSignal.timeout(ping.value * 9), presignal]),
          ...new RpcCounter().prepare({ method: "net_get" }),
        }).then(r => r.getOrThrow())

        const secret = await generateOrThrow(params)

        await TorRpc.fetchWithCircuitOrThrow<void>(url, {
          circuit,
          signal: AbortSignal.any([AbortSignal.timeout(ping.value * 9), presignal]),
          ...new RpcCounter().prepare({ method: "net_tip", params: [secret] })
        }).then(r => r.getOrThrow())

        return await TorRpc.fetchWithCircuitOrThrow<T>(url, {
          circuit,
          signal: AbortSignal.any([AbortSignal.timeout(ping.value * 9), presignal]),
          ...new RpcCounter().prepare(info)
        }).then(r => Fetched.rewrap(r))
      }
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

  export async function parseOrThrow(context: BgEthereumContext, request: RpcRequestPreinit<unknown>, storage: QueryStorage) {
    const [tx, block] = (request as RpcRequestPreinit<[unknown, string]>).params

    return schema(context, tx, block, storage)
  }

  export function schema(context: BgEthereumContext, tx: unknown, block: string, storage: QueryStorage) {
    const fetcher = async (request: K, more: RequestInit) =>
      await fetchOrFail<SimulationData>(context, request, more).then(r => r.inspectErrSync(e => console.error({ e },)))

    return createQuery<K, D, F>({
      key: key(context.chain.chainId, tx, block),
      fetcher,
      storage
    })
  }

}