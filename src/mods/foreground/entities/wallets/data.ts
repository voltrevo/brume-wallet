import { RpcRequestPreinit } from "@/libs/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { EthereumSession } from "@/libs/tor/sessions/session"
import { Optional } from "@hazae41/option"
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume"
import { Result } from "@hazae41/result"
import { Fetched, FetcherMore, createQuerySchema, useError, useFetch, useOnce, useQuery } from "@hazae41/xswr"
import { Background } from "../../background/background"

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

export function getWallet(uuid: Optional<string>, background: Background) {
  if (uuid === undefined)
    return undefined

  const fetcher = async <T>(init: RpcRequestPreinit, more: FetcherMore) =>
    Fetched.rewrap(await background.tryGet(0).then(async r => r.andThen(bg => bg.request<T>(init))))

  return createQuerySchema<RpcRequestPreinit, WalletData, Error>({
    method: "brume_getWallet",
    params: [uuid]
  }, fetcher)
}

export function useWallet(uuid: Optional<string>, background: Background) {
  const query = useQuery(getWallet, [uuid, background])
  useOnce(query)
  return query
}

export async function fetchWithSession(session: EthereumSession, init: RpcRequestPreinit, more: FetcherMore) {
  return await Result.unthrow<Fetched<string, ClosedError | ErroredError | AbortedError | unknown>>(async t => {
    const { signal = AbortSignals.timeout(5_000) } = more

    console.log(`Fetching ${init.method} with`, session.circuit.id)

    const socket = await session.socket.tryGet(0).then(r => r.throw(t))

    const response = await session.client
      .tryFetchWithSocket<string>(socket, init, signal)
      .then(r => Fetched.rewrap(r).throw(t))

    const body = JSON.stringify({ method: init.method, tor: true })

    session.circuit
      .tryFetch("http://proxy.brume.money", { method: "POST", body })
      .then(r => r.inspectErrSync(console.warn).ignore())

    return Fetched.rewrap(response)
  })
}

export function getBalanceSchema(address: string | undefined, session: EthereumSession | undefined) {
  if (!address || !session) return

  const fetcher = async (init: RpcRequestPreinit, more: FetcherMore) => {
    return await fetchWithSession(session, init, more).then(r => r.mapSync(BigInt))
  }

  return createQuerySchema({
    chainId: session.chain.id,
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher)
}

export function useBalance(address: string | undefined, session: EthereumSession | undefined) {
  const query = useQuery(getBalanceSchema, [address, session])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getNonceSchema(address: string | undefined, session: EthereumSession | undefined) {
  if (!address || !session) return

  const fetcher = async (init: RpcRequestPreinit, more: FetcherMore) => {
    return await fetchWithSession(session, init, more).then(r => r.mapSync(BigInt))
  }

  return createQuerySchema({
    chainId: session.chain.id,
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher)
}

export function useNonce(address: string | undefined, session: EthereumSession | undefined) {
  const query = useQuery(getNonceSchema, [address, session])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getGasPriceSchema(session: EthereumSession | undefined) {
  if (!session) return

  const fetcher = async (init: RpcRequestPreinit, more: FetcherMore) => {
    return await fetchWithSession(session, init, more).then(r => r.mapSync(BigInt))
  }

  return createQuerySchema({
    chainId: session.chain.id,
    method: "eth_gasPrice",
    params: []
  }, fetcher)
}

export function useGasPrice(session: EthereumSession | undefined) {
  const query = useQuery(getGasPriceSchema, [session])
  useFetch(query)
  useError(query, console.error)
  return query
}