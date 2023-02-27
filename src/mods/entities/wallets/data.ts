import { Future } from "@/libs/futures/future"
import { RPC } from "@/libs/rpc/rpc"
import { WebSockets } from "@/libs/websockets/websockets"
import { Pipes } from "@/libs/xswr/pipes"
import { storage } from "@/libs/xswr/storage"
import { CircuitPool } from "@hazae41/echalote"
import { Fleche } from "@hazae41/fleche"
import { FetcherMore, getSingleSchema, NormalizerMore, useFetch, useQuery } from "@hazae41/xswr"

export type Wallet =
  | WalletRef
  | WalletData

export interface WalletProps {
  wallet: Wallet
}

export interface WalletDataProps {
  wallet: WalletData
}

export interface WalletRef {
  ref: true
  address: string
}

export interface WalletData {
  name: string,
  address: string,
  privateKey: string
}

export function getWalletSchema(address?: string) {
  return getSingleSchema<WalletData>(
    address && `wallet/${address}`,
    undefined, { storage })
}

export async function getWalletNormal(wallet: Wallet, more: NormalizerMore) {
  if ("ref" in wallet) return wallet
  const schema = getWalletSchema(wallet.address)
  await schema.normalize(wallet, more)
  return { ref: true, address: wallet.address } as WalletRef
}

export function useWallet(address?: string) {
  return useQuery(getWalletSchema, [address])
}

export function getBalanceSchema(address: string, socket: Fleche.WebSocket) {

  async function fetcher<T>(req: RPC.FullRequest, more: FetcherMore) {
    const { signal } = more

    const request = RPC.request(req)
    socket.send(JSON.stringify(request))

    const future = new Future<RPC.Response<T>>()

    const onEvent = async (event: Event) => {
      const msgEvent = event as MessageEvent<string>
      const response = JSON.parse(msgEvent.data) as RPC.Response<T>
      if (response.id === request.id) future.ok(response)
    }

    const response = await WebSockets.waitFor(socket, { future, onEvent, signal })
    return Pipes.data(d => d && BigInt(d))(RPC.rewrap(response))
  }

  return getSingleSchema<bigint, RPC.FullRequest>({
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher)
}

export function useBalance(address: string, socket: Fleche.WebSocket) {
  const query = useQuery(getBalanceSchema, [address, socket])
  useFetch(query)
  return query
}

export function getNonceSchema(endpoint: string, address: string, circuits: CircuitPool) {
  async function fetcher(req: RPC.RequestWithInfo, more: FetcherMore) {
    const circuit = await circuits.get()
    const result = await RPC.fetch<string>(req, more, circuit.fetch.bind(circuit))
    return Pipes.data(d => d && BigInt(d))(result)
  }

  return getSingleSchema<bigint, RPC.RequestWithInfo>({
    endpoint,
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher)
}

export function useNonce(address: string, circuits: CircuitPool) {
  const endpoint = "https://rpc.ankr.com/eth_goerli"
  const query = useQuery(getNonceSchema, [endpoint, address, circuits])
  useFetch(query)
  return query
}

export function getGasPriceSchema(endpoint: string, circuits: CircuitPool) {
  async function fetcher(req: RPC.RequestWithInfo, more: FetcherMore) {
    const circuit = await circuits.get()
    const result = await RPC.fetch<string>(req, more, circuit.fetch.bind(circuit))
    return Pipes.data(d => d && BigInt(d))(result)
  }

  return getSingleSchema<bigint, RPC.RequestWithInfo>({
    endpoint,
    method: "eth_gasPrice",
    params: []
  }, fetcher)
}

export function useGasPrice(circuit: CircuitPool) {
  const endpoint = "https://rpc.ankr.com/eth_goerli"
  const query = useQuery(getGasPriceSchema, [endpoint, circuit])
  useFetch(query)
  return query
}