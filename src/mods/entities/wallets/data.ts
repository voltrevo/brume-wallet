import { Rpc } from "@/libs/rpc"
import { Session } from "@/libs/tor/sessions/session"
import { useUserStorage } from "@/mods/storage/user/context"
import { Pool } from "@hazae41/piscine"
import { FetcherMore, getSchema, NormalizerMore, Result, StorageQueryParams, useError, useFetch, useSchema } from "@hazae41/xswr"

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

export function getWalletSchema(address: string | undefined, storage: StorageQueryParams<any> | undefined) {
  if (!address || !storage) return

  return getSchema<WalletData>(`wallet/${address}`, undefined, { storage })
}

export async function getWalletRef(wallet: Wallet, storage: StorageQueryParams<any> | undefined, more: NormalizerMore) {
  if ("ref" in wallet) return wallet

  const schema = getWalletSchema(wallet.address, storage)
  await schema?.normalize(wallet, more)

  return { ref: true, address: wallet.address } as WalletRef
}

export function useWallet(address: string | undefined) {
  const storage = useUserStorage()

  return useSchema(getWalletSchema, [address, storage])
}

export function getBalanceSchema(address: string, sessions?: Pool<Session>) {
  if (!sessions) return

  const fetcher = async (init: Rpc.RequestInit, more: FetcherMore) => {
    const { signal } = more

    const session = await sessions.cryptoRandom()
    const request = session.client.request(init)
    const response = await Rpc.fetchWithSocket<string>(request, session.socket, signal)

    const body = JSON.stringify({ method: "eth_getBalance", tor: true })
    session.circuit.fetch("http://proxy.brume.money", { method: "POST", body })

    return Result.rewrap(response).map(BigInt)
  }

  return getSchema({
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher)
}

export function useBalance(address: string, sockets: Pool<Session> | undefined) {
  const query = useSchema(getBalanceSchema, [address, sockets])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getNonceSchema(address: string, sessions: Pool<Session> | undefined) {
  if (!sessions) return

  const fetcher = async (init: Rpc.RequestInit, more: FetcherMore) => {
    const { signal } = more

    const session = await sessions.cryptoRandom()
    const request = session.client.request(init)
    const response = await Rpc.fetchWithSocket<string>(request, session.socket, signal)

    const body = JSON.stringify({ method: "eth_getTransactionCount", tor: true })
    session.circuit.fetch("http://proxy.brume.money", { method: "POST", body })

    return Result.rewrap(response).map(BigInt)
  }

  return getSchema({
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher)
}

export function useNonce(address: string, sessions: Pool<Session> | undefined) {
  const query = useSchema(getNonceSchema, [address, sessions])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getGasPriceSchema(sessions: Pool<Session> | undefined) {
  if (!sessions) return

  const fetcher = async <T extends unknown[]>(init: Rpc.RequestInit<T>, more: FetcherMore) => {
    const { signal } = more

    const session = await sessions.cryptoRandom()
    const request = session.client.request(init)
    const response = await Rpc.fetchWithSocket<string>(request, session.socket, signal)

    const body = JSON.stringify({ method: "eth_gasPrice", tor: true })
    session.circuit.fetch("http://proxy.brume.money", { method: "POST", body })

    return Result.rewrap(response).map(BigInt)
  }

  return getSchema({
    method: "eth_gasPrice",
    params: []
  }, fetcher)
}

export function useGasPrice(sessions: Pool<Session> | undefined) {
  const query = useSchema(getGasPriceSchema, [sessions])
  useFetch(query)
  useError(query, console.error)
  return query
}