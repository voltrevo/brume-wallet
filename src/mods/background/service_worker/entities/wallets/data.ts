import { BigInts } from "@/libs/bigints/bigints"
import { RpcParamfulRequestPreinit, RpcRequestPreinit } from "@/libs/rpc"
import { IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"
import { EthereumConnection, EthereumSocket } from "../sessions/data"

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
  await schema?.normalize(wallet, more)

  return { ref: true, uuid: wallet.uuid } as WalletRef
}

export type EthereumQueryKey<T> = RpcRequestPreinit<T> & {
  chainId: number
}

export function getUnknown(request: RpcRequestPreinit<unknown>, connection: EthereumConnection, storage: IDBStorage) {
  const fetcher = async ({ method, params }: EthereumQueryKey<unknown>) =>
    await EthereumSocket.tryFetch(connection, { method, params }, {})

  return createQuerySchema<EthereumQueryKey<unknown>, any, Error>({
    chainId: connection.chain.id,
    method: request.method,
    params: request.params
  }, fetcher, { storage })
}

export function getBalance(address: string, block: string, connection: EthereumConnection, storage: IDBStorage) {
  const fetcher = async ({ method, params }: EthereumQueryKey<unknown>) =>
    await EthereumSocket.tryFetch(connection, { method, params }, {}).then(r => r.mapSync(d => d.mapSync(BigInt)))

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: connection.chain.id,
    method: "eth_getBalance",
    params: [address, block]
  }, fetcher, { storage, dataSerializer: BigInts })
}

export function getRpcBalance(request: RpcRequestPreinit<unknown>, connection: EthereumConnection, storage: IDBStorage) {
  const [address, block] = (request as RpcParamfulRequestPreinit<[string, string]>).params

  return getBalance(address, block, connection, storage)
}

export function getEthereum(request: RpcRequestPreinit<any>, connection: EthereumConnection, storage: IDBStorage) {
  if (request.method === "eth_getBalance")
    return getRpcBalance(request, connection, storage)
  return getUnknown(request, connection, storage)
}