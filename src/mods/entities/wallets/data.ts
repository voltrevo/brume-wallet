import { RPC } from "@/libs/rpc/rpc"
import { SocketPool } from "@/libs/tor/sockets/pool"
import { Results } from "@/libs/xswr/results"
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

export function getBalanceSchema(address: string, sockets?: SocketPool) {
  if (!sockets) return

  const fetcher = async (init: RPC.RequestInit, more: FetcherMore) => {
    const { signal } = more

    const socket = await sockets.random()
    const response = await RPC.fetchWithSocket<string>(init, socket, signal)

    return Results.map(RPC.rewrap(response), BigInt)
  }

  return getSchema<bigint, RPC.RequestInit>({
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher)
}

export function useBalance(address: string, sockets?: SocketPool) {
  const query = useSchema(getBalanceSchema, [address, sockets])
  useFetch(query)
  return query
}

export function getNonceSchema(address: string, sockets?: SocketPool) {
  if (!sockets) return

  const fetcher = async (init: RPC.RequestInit, more: FetcherMore) => {
    const { signal } = more

    const socket = await sockets.random()
    const response = await RPC.fetchWithSocket<string>(init, socket, signal)

    return Results.map(RPC.rewrap(response), BigInt)
  }

  return getSchema<bigint, RPC.RequestInit>({
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher)
}

export function useNonce(address: string, sockets?: SocketPool) {
  const query = useSchema(getNonceSchema, [address, sockets])
  useFetch(query)
  return query
}

export function getGasPriceSchema(sockets?: SocketPool) {
  if (!sockets) return

  const fetcher = async <T extends unknown[]>(init: RPC.RequestInit<T>, more: FetcherMore) => {
    const { signal } = more

    const socket = await sockets.random()
    const response = await RPC.fetchWithSocket<string>(init, socket, signal)

    return Results.map(RPC.rewrap(response), BigInt)
  }

  return getSchema<bigint, RPC.RequestInit>({
    method: "eth_gasPrice",
    params: []
  }, fetcher)
}

export function useGasPrice(sockets?: SocketPool) {
  const query = useSchema(getGasPriceSchema, [sockets])
  useFetch(query)
  return query
}