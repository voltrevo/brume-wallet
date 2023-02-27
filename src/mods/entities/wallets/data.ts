import { RPC } from "@/libs/rpc/rpc"
import { Pipes } from "@/libs/xswr/pipes"
import { storage } from "@/libs/xswr/storage"
import { Circuit } from "@hazae41/echalote"
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

export function getBalanceSchema(endpoint: string, address: string, circuit: Circuit) {
  async function fetcher(req: RPC.RequestWithInfo, more: FetcherMore) {
    const result = await RPC.fetch<string>(req, more, circuit.fetch.bind(circuit))
    return Pipes.data(d => d && BigInt(d))(result)
  }

  return getSingleSchema<bigint, RPC.RequestWithInfo>({
    endpoint,
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher)
}

export function useBalance(address: string, circuit: Circuit) {
  const endpoint = "https://rpc.ankr.com/eth_goerli"
  const query = useQuery(getBalanceSchema, [endpoint, address, circuit])
  useFetch(query)
  return query
}

export function getNonceSchema(endpoint: string, address: string, circuit: Circuit) {
  async function fetcher(req: RPC.RequestWithInfo, more: FetcherMore) {
    const result = await RPC.fetch<string>(req, more, circuit.fetch.bind(circuit))
    return Pipes.data(d => d && BigInt(d))(result)
  }

  return getSingleSchema<bigint, RPC.RequestWithInfo>({
    endpoint,
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher)
}

export function useNonce(address: string, circuit: Circuit) {
  const endpoint = "https://rpc.ankr.com/eth_goerli"
  const query = useQuery(getNonceSchema, [endpoint, address, circuit])
  useFetch(query)
  return query
}

export function getGasPriceSchema(endpoint: string, circuit: Circuit) {
  async function fetcher(req: RPC.RequestWithInfo, more: FetcherMore) {
    const result = await RPC.fetch<string>(req, more, circuit.fetch.bind(circuit))
    return Pipes.data(d => d && BigInt(d))(result)
  }

  return getSingleSchema<bigint, RPC.RequestWithInfo>({
    endpoint,
    method: "eth_gasPrice",
    params: []
  }, fetcher)
}

export function useGasPrice(circuit: Circuit) {
  const endpoint = "https://rpc.ankr.com/eth_goerli"
  const query = useQuery(getGasPriceSchema, [endpoint, circuit])
  useFetch(query)
  return query
}