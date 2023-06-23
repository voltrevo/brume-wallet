import { BigInts } from "@/libs/bigints/bigints"
import { EthereumChain } from "@/libs/ethereum/chain"
import { RpcRequestPreinit } from "@/libs/rpc"
import { Option } from "@hazae41/option"
import { Cancel, Looped, Retry, tryLoop } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"
import { Data, FetchError, Fetched, FetcherMore, IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"
import { EthereumBrumes, EthereumSocket } from "../sessions/data"

export type Wallet =
  | WalletRef
  | WalletData

export interface WalletProps {
  readonly wallet: Wallet
}

export interface WalletDataProps {
  readonly wallet: WalletData
}

export interface WalletRef {
  readonly ref: true
  readonly uuid: string
}

export type WalletData =
  | EthereumPrivateKeyWallet

export type EthereumWalletData =
  | EthereumPrivateKeyWallet

export interface EthereumPrivateKeyWallet {
  readonly coin: "ethereum"
  readonly type: "privateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly privateKey: string
  readonly address: string
}

export interface BitcoinPrivateKeyWallet {
  readonly coin: "bitcoin"
  readonly type: "privateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly privateKey: string
  readonly compressedAddress: string
  readonly uncompressedAddress: string
}

export function getWallet(uuid: string, storage: IDBStorage) {
  return createQuerySchema<string, WalletData, never>(`wallet/${uuid}`, undefined, { storage })
}

export async function getWalletRef(wallet: Wallet, storage: IDBStorage, more: NormalizerMore) {
  if ("ref" in wallet) return wallet

  const schema = getWallet(wallet.uuid, storage)
  await schema?.normalize(new Data(wallet), more)

  return { ref: true, uuid: wallet.uuid } as WalletRef
}

export type EthereumQueryKey<T> = RpcRequestPreinit<T> & {
  chainId: number
}

export interface EthereumSession {
  wallet: Wallet
  chain: EthereumChain
}

export function getEthereumSession(origin: string, storage: IDBStorage) {
  return createQuerySchema<string, EthereumSession, never>(`sessions/${origin}`, undefined, { storage })
}

export interface EthereumSessionAndBrumes {
  origin: string
  session: EthereumSession
  brumes: EthereumBrumes
}

export async function tryFetch<T>(ethereum: EthereumSessionAndBrumes, request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) {
  return await tryLoop(async (i) => {
    return await Result.unthrow<Result<Fetched<T, Error>, Looped<Error>>>(async t => {
      const brume = await ethereum.brumes.inner.tryGet(i).then(r => r.mapErrSync(Retry.new).throw(t))
      const socket = Option.wrap(brume.chains[ethereum.session.chain.chainId]).ok().mapErrSync(Cancel.new).throw(t)
      const response = await EthereumSocket.request<T>(socket, request).then(r => r.mapErrSync(Retry.new).throw(t))

      return new Ok(Fetched.rewrap(response))
    })
  }).then(r => r.mapErrSync(FetchError.from))
}

export function getEthereumUnknown(ethereum: EthereumSessionAndBrumes, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
  const fetcher = async (request: RpcRequestPreinit<unknown>) =>
    await tryFetch<unknown>(ethereum, request)

  return createQuerySchema<EthereumQueryKey<unknown>, any, Error>({
    chainId: ethereum.session.chain.chainId,
    method: request.method,
    params: request.params
  }, fetcher, { storage })
}

export function getEthereumBalance(ethereum: EthereumSessionAndBrumes, address: string, block: string, storage: IDBStorage) {
  const fetcher = async (request: RpcRequestPreinit<unknown>) =>
    await tryFetch<string>(ethereum, request).then(r => r.mapSync(d => d.mapSync(BigInt)))

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.session.chain.chainId,
    method: "eth_getBalance",
    params: [address, block]
  }, fetcher, { storage, dataSerializer: BigInts })
}