import { Rpc } from "@/libs/rpc"
import { Session } from "@/libs/tor/sessions/session"
import { useUserStorage } from "@/mods/storage/user/context"
import { FetchResult, FetcherMore, NormalizerMore, StorageQueryParams, getSchema, useError, useFetch, useSchema } from "@hazae41/xswr"

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
  uuid: string
}

export type WalletData =
  | EthereumPrivateKeyWallet

export interface EthereumPrivateKeyWallet {
  coin: "ethereum"
  type: "privateKey"

  uuid: string
  name: string,

  color: number,
  emoji: string

  privateKey: string
  address: string
}

export interface BitcoinPrivateKeyWallet {
  coin: "bitcoin"
  type: "privateKey"

  uuid: string
  name: string,

  color: number,
  emoji: string

  privateKey: string
  compressedAddress: string
  uncompressedAddress: string
}

export function getWalletSchema(uuid: string | undefined, storage: StorageQueryParams<any> | undefined) {
  if (!uuid || !storage) return

  return getSchema<WalletData>(`wallet/${uuid}`, undefined, { storage })
}

export async function getWalletRef(wallet: Wallet, storage: StorageQueryParams<any> | undefined, more: NormalizerMore) {
  if ("ref" in wallet) return wallet

  const schema = getWalletSchema(wallet.uuid, storage)
  await schema?.normalize(wallet, more)

  return { ref: true, uuid: wallet.uuid } as WalletRef
}

export function useWallet(uuid: string | undefined) {
  const storage = useUserStorage()

  return useSchema(getWalletSchema, [uuid, storage])
}

export function getBalanceSchema(address: string | undefined, session: Session | undefined) {
  if (!address || !session) return

  const fetcher = async (init: Rpc.RequestInit, more: FetcherMore) => {
    const { signal } = more

    console.log(session.circuit.id)

    const request = session.client.request(init)
    const response = await Rpc.fetchWithSocket<string>(request, session.socket, signal)

    const body = JSON.stringify({ method: init.method, tor: true })
    session.circuit.fetch("http://proxy.brume.money", { method: "POST", body })

    return FetchResult.rewrap(response).mapSync(BigInt)
  }

  return getSchema({
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher)
}

export function useBalance(address: string | undefined, session: Session | undefined) {
  const query = useSchema(getBalanceSchema, [address, session])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getNonceSchema(address: string | undefined, session: Session | undefined) {
  if (!address || !session) return

  const fetcher = async (init: Rpc.RequestInit, more: FetcherMore) => {
    const { signal } = more

    console.log(session.circuit.id)

    const request = session.client.request(init)
    const response = await Rpc.fetchWithSocket<string>(request, session.socket, signal)

    const body = JSON.stringify({ method: init.method, tor: true })
    session.circuit.fetch("http://proxy.brume.money", { method: "POST", body })

    return FetchResult.rewrap(response).mapSync(BigInt)
  }

  return getSchema({
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher)
}

export function useNonce(address: string | undefined, session: Session | undefined) {
  const query = useSchema(getNonceSchema, [address, session])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getGasPriceSchema(session: Session | undefined) {
  if (!session) return

  const fetcher = async <T extends unknown[]>(init: Rpc.RequestInit<T>, more: FetcherMore) => {
    const { signal } = more

    console.log(session.circuit.id)

    const request = session.client.request(init)
    const response = await Rpc.fetchWithSocket<string>(request, session.socket, signal)

    const body = JSON.stringify({ method: init.method, tor: true })
    session.circuit.fetch("http://proxy.brume.money", { method: "POST", body })

    return FetchResult.rewrap(response).mapSync(BigInt)
  }

  return getSchema({
    method: "eth_gasPrice",
    params: []
  }, fetcher)
}

export function useGasPrice(session: Session | undefined) {
  const query = useSchema(getGasPriceSchema, [session])
  useFetch(query)
  useError(query, console.error)
  return query
}