import { EnsAbi } from "@/libs/abi/ens.abi"
import { Uint8Array } from "@hazae41/bytes"
import { Abi, Ens, ZeroHexString } from "@hazae41/cubane"
import { Data, Fail, Fetched, FetcherMore, IDBStorage, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Nullable } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { BgEthereumContext } from "../../context"
import { EthereumQueryKey } from "../wallets/data"

export namespace BgEns {

  export namespace Resolver {

    export async function fetchOrFail(ethereum: BgEthereumContext, namehash: Uint8Array<32>, more: FetcherMore): Promise<Fetched<ZeroHexString, Error>> {
      try {
        const registry = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"

        const data = Abi.encodeOrThrow(EnsAbi.resolver.from(namehash))

        const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(ethereum, {
          method: "eth_call",
          params: [{
            to: registry,
            data: data
          }, "pending"]
        }, more)

        if (fetched.isErr())
          return fetched

        const returns = Abi.createTuple(Abi.Address)
        const [address] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

        return new Data(address)
      } catch (e: unknown) {
        return new Fail(Catched.from(e))
      }
    }


  }

  export namespace Lookup {

    export type Key = EthereumQueryKey<unknown>
    export type Data = ZeroHexString
    export type Fail = Error

    export const method = "ens_lookup"

    export function key(name: string) {
      return {
        chainId: 1,
        method: method,
        params: [name]
      }
    }

    export async function parseOrThrow(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
      const [name] = (request as RpcRequestPreinit<[string]>).params

      return schema(ethereum, name, storage)
    }

    export function schema(ethereum: BgEthereumContext, name: string, storage: IDBStorage) {
      const fetcher = (key: Key, more: FetcherMore) =>
        fetchOrFail(ethereum, name, more)

      return createQuery<Key, Data, Error>({
        key: key(name),
        fetcher,
        storage
      })
    }

    export async function fetchOrFail(ethereum: BgEthereumContext, name: string, more: FetcherMore) {
      try {
        const namehash = Ens.namehashOrThrow(name) as Uint8Array<32>
        const resolver = await Resolver.fetchOrFail(ethereum, namehash, more)

        if (resolver.isErr())
          return resolver

        const data = Abi.encodeOrThrow(EnsAbi.addr.from(namehash))

        const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(ethereum, {
          method: "eth_call",
          params: [{
            to: resolver.inner,
            data: data
          }, "pending"]
        }, more)

        if (fetched.isErr())
          return fetched

        const returns = Abi.createTuple(Abi.Address)
        const [address] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

        return new Data(address)
      } catch (e: unknown) {
        return new Fail(Catched.from(e))
      }
    }

  }

  export namespace Reverse {

    export type Key = EthereumQueryKey<unknown>
    export type Data = Nullable<string>
    export type Fail = Error

    export const method = "ens_reverse"

    export function key(address: ZeroHexString) {
      return {
        chainId: 1,
        method: method,
        params: [address]
      }
    }

    export async function parseOrThrow(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
      const [address] = (request as RpcRequestPreinit<[ZeroHexString]>).params

      return schema(ethereum, address, storage)
    }

    export function schema(ethereum: BgEthereumContext, address: ZeroHexString, storage: IDBStorage) {
      const fetcher = (key: Key, more: FetcherMore) => fetchOrFail(ethereum, address, more)

      return createQuery<Key, Data, Fail>({
        key: key(address),
        fetcher,
        storage
      })
    }

    export async function fetchUncheckedOrFail(ethereum: BgEthereumContext, address: ZeroHexString, more: FetcherMore): Promise<Fetched<Nullable<string>, Error>> {
      try {
        const namehash = Ens.namehashOrThrow(`${address.slice(2)}.addr.reverse`) as Uint8Array<32>
        const resolver = await Resolver.fetchOrFail(ethereum, namehash, more)

        if (resolver.isErr())
          return resolver

        const data = Abi.encodeOrThrow(EnsAbi.name.from(namehash))

        const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(ethereum, {
          method: "eth_call",
          params: [{
            to: resolver.inner,
            data: data
          }, "pending"]
        }, more)

        if (fetched.isErr())
          return fetched

        const returns = Abi.createTuple(Abi.String)
        const [name] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

        if (name.length === 0)
          return new Data(undefined)

        return new Data(name)
      } catch (e: unknown) {
        return new Fail(Catched.from(e))
      }
    }

    export async function fetchOrFail(ethereum: BgEthereumContext, address: ZeroHexString, more: FetcherMore) {
      const name = await fetchUncheckedOrFail(ethereum, address, more)

      if (name.isErr())
        return name

      if (name.inner == null)
        return name

      const address2 = await Lookup.fetchOrFail(ethereum, name.inner, more)

      if (address2.isErr())
        return address2

      if (address.toLowerCase() !== address2.inner.toLowerCase())
        return new Data(undefined)

      return name
    }

  }

}