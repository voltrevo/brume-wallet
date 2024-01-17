import { Errors } from "@/libs/errors/errors";
import { BgSignature } from "@/mods/background/service_worker/entities/signatures/data";
import { Abi, ZeroHexString } from "@hazae41/cubane";
import { Data, Fail, createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { Catched } from "@hazae41/result";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorageContext } from "../../storage/user";
import { FgEthereumContext, fetchOrFail } from "../wallets/data";

export namespace FgSignature {

  export type Key = BgSignature.Key
  export type Data = BgSignature.Data
  export type Fail = BgSignature.Fail

  export const key = BgSignature.key

  export function schema(hash: Nullable<ZeroHexString>, ethereum: Nullable<FgEthereumContext>, storage: UserStorage) {
    if (ethereum == null)
      return
    if (hash == null)
      return

    const maybeKey = key(hash)

    if (maybeKey == null)
      return

    const fetcher = async (request: Key) => {
      try {
        const fetched = await fetchOrFail<ZeroHexString>(request, ethereum)

        if (fetched.isErr())
          return fetched

        const returns = Abi.createTuple(Abi.createVector(Abi.String))
        const [texts] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

        return new Data(texts)
      } catch (e: unknown) {
        return new Fail(Catched.from(e))
      }
    }

    return createQuery<Key, Data, Fail>({
      key: maybeKey,
      fetcher,
      storage
    })
  }

}

export function useSignature(hash: Nullable<ZeroHexString>, ethereum: Nullable<FgEthereumContext>,) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSignature.schema, [hash, ethereum, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}