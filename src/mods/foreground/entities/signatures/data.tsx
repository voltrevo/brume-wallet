import { Errors } from "@/libs/errors/errors";
import { BgSignature } from "@/mods/background/service_worker/entities/signatures/data";
import { Abi, ZeroHexString } from "@hazae41/cubane";
import { Data, Fail, createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { Catched } from "@hazae41/result";
import { UserStorage, useUserStorageContext } from "../../storage/user";
import { FgEthereumContext, fetchOrFail } from "../wallets/data";

export namespace FgSignature {

  export type K = BgSignature.K
  export type D = BgSignature.D
  export type F = BgSignature.F

  export const key = BgSignature.key

  export function schema(hash: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
    if (context == null)
      return
    if (hash == null)
      return

    const maybeKey = key(hash)

    if (maybeKey == null)
      return

    const fetcher = async (request: K) => {
      try {
        const fetched = await fetchOrFail<ZeroHexString>(request, context)

        if (fetched.isErr())
          return fetched

        const returns = Abi.Tuple.create(Abi.Vector.create(Abi.String))
        const [texts] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

        return new Data(texts)
      } catch (e: unknown) {
        return new Fail(Catched.wrap(e))
      }
    }

    return createQuery<K, D, F>({
      key: maybeKey,
      fetcher,
      storage
    })
  }

}

export function useSignature(hash: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgSignature.schema, [hash, context, storage])
  useFetch(query)
  useVisible(query)

  useError(query, Errors.onQueryError)
  return query
}