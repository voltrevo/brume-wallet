import { RPC } from "@/libs/rpc/rpc"
import { Pipes } from "@/libs/xswr/pipes"
import { storage } from "@/libs/xswr/storage"
import { FetcherMore, getSchema, NormalizerMore, useFetch, useSchema } from "@hazae41/xswr"

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
  return getSchema<WalletData>(address && `wallet/${address}`, undefined, { storage })
}

export async function getWalletNormal(wallet: Wallet, more: NormalizerMore) {
  if ("ref" in wallet) return wallet
  const schema = getWalletSchema(wallet.address)
  await schema.normalize(wallet, more)
  return { ref: true, address: wallet.address } as WalletRef
}

export function useWallet(address?: string) {
  return useSchema(getWalletSchema, [address])
}

export function getBalanceSchema(address: string, socket?: WebSocket) {
  if (!socket) return

  async function fetcher<T extends unknown[]>(init: RPC.RequestInit<T>, more: FetcherMore) {
    const { signal } = more
    const request = new RPC.Request(init)
    const response = await request.query(socket!, signal)
    return Pipes.data(d => d && BigInt(d))(RPC.rewrap(response))
  }

  return getSchema<bigint, RPC.RequestInit>({
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher)
}

export function useBalance(address: string, socket?: WebSocket) {
  const query = useSchema(getBalanceSchema, [address, socket])
  useFetch(query)
  return query
}

export function getNonceSchema(address: string, socket?: WebSocket) {
  if (!socket) return

  async function fetcher<T extends unknown[]>(init: RPC.RequestInit<T>, more: FetcherMore) {
    const { signal } = more
    const request = new RPC.Request(init)
    const response = await request.query(socket!, signal)
    return Pipes.data(d => d && BigInt(d))(RPC.rewrap(response))
  }

  return getSchema<bigint, RPC.RequestInit>({
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher)
}

export function useNonce(address: string, socket?: WebSocket) {
  const query = useSchema(getNonceSchema, [address, socket])
  useFetch(query)
  return query
}

export function getGasPriceSchema(socket?: WebSocket) {
  if (!socket) return

  async function fetcher<T extends unknown[]>(init: RPC.RequestInit<T>, more: FetcherMore) {
    const { signal } = more
    const request = new RPC.Request(init)
    const response = await request.query(socket!, signal)
    return Pipes.data(d => d && BigInt(d))(RPC.rewrap(response))
  }

  return getSchema<bigint, RPC.RequestInit>({
    method: "eth_gasPrice",
    params: []
  }, fetcher)
}

export function useGasPrice(socket?: WebSocket) {
  const query = useSchema(getGasPriceSchema, [socket])
  useFetch(query)
  return query
}