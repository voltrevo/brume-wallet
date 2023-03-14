import { Rpc } from "@/libs/rpc"
import { Session } from "@/libs/tor/sessions/session"
import { storage } from "@/libs/xswr/storage"
import { Pool } from "@hazae41/piscine"
import { FetcherMore, getSchema, NormalizerMore, Result, useError, useFetch, useSchema } from "@hazae41/xswr"

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
  if (!address) return

  return getSchema<WalletData>(`wallet/${address}`, undefined, { storage })
}

export async function getWalletNormal(wallet: Wallet, more: NormalizerMore) {
  if ("ref" in wallet) return wallet

  const schema = getWalletSchema(wallet.address)
  await schema?.normalize(wallet, more)

  return { ref: true, address: wallet.address } as WalletRef
}

export function useWallet(address?: string) {
  return useSchema(getWalletSchema, [address])
}

export function getBalanceSchema(address: string, sessions?: Pool<Session>) {
  if (!sessions) return

  const fetcher = async (init: Rpc.RequestInit, more: FetcherMore) => {
    const { signal } = more

    const session = await sessions.cryptoRandom()
    const request = session.client.request(init)
    const response = await Rpc.fetchWithSocket<string>(request, session.socket, signal)

    return Result.rewrap(response).map(BigInt)
  }

  return getSchema({
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher)
}

export function useBalance(address: string, sockets?: Pool<Session>) {
  const query = useSchema(getBalanceSchema, [address, sockets])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getNonceSchema(address: string, sessions?: Pool<Session>) {
  if (!sessions) return

  const fetcher = async (init: Rpc.RequestInit, more: FetcherMore) => {
    const { signal } = more

    const session = await sessions.cryptoRandom()
    const request = session.client.request(init)
    const response = await Rpc.fetchWithSocket<string>(request, session.socket, signal)

    return Result.rewrap(response).map(BigInt)
  }

  return getSchema({
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher)
}

export function useNonce(address: string, sockets?: Pool<Session>) {
  const query = useSchema(getNonceSchema, [address, sockets])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getGasPriceSchema(sessions?: Pool<Session>) {
  if (!sessions) return

  const fetcher = async <T extends unknown[]>(init: Rpc.RequestInit<T>, more: FetcherMore) => {
    const { signal } = more

    const session = await sessions.cryptoRandom()
    const request = session.client.request(init)
    const response = await Rpc.fetchWithSocket<string>(request, session.socket, signal)

    return Result.rewrap(response).map(BigInt)
  }

  return getSchema({
    method: "eth_gasPrice",
    params: []
  }, fetcher)
}

export function useGasPrice(sockets?: Pool<Session>) {
  const query = useSchema(getGasPriceSchema, [sockets])
  useFetch(query)
  useError(query, console.error)
  return query
}