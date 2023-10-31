import { Maps } from "@/libs/maps/maps";
import { ZeroHexString } from "@hazae41/cubane";
import { Fetched, IDBStorage, createQuery } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Option } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { BgEthereumContext, EthereumFetchParams, EthereumQueryKey } from "../wallets/data";

export interface SignatureData {
  readonly hash: ZeroHexString,
  readonly signature: string
}

export async function tryFetchRaw<T>(ethereum: BgEthereumContext, url: string, init?: EthereumFetchParams) {
  return await Result.runAndDoubleWrap<Fetched<T, Error>>(async () => {
    const { brume } = ethereum

    const circuits = Option.wrap(brume.circuits).ok().unwrap()

    async function runWithPoolOrThrow(index: number) {
      return await Result.unthrow<Result<T, Error>>(async t => {
        const circuit = await circuits.tryGet(index).then(r => r.throw(t).throw(t).inner)

        const res = await circuit.tryFetch(url).then(r => r.throw(t))

        const json = await Result.runAndDoubleWrap(async () => {
          return await res.json() as T
        }).then(r => r.throw(t))

        return new Ok(json)
      }).then(r => Fetched.rewrap(r).inspectErrSync(e => console.warn({ e })))
    }

    const promises = Array.from({ length: circuits.capacity }, (_, i) => runWithPoolOrThrow(i))

    const results = await Promise.allSettled(promises)

    const fetcheds = new Map<string, Fetched<T, Error>>()
    const counters = new Map<string, number>()

    for (const result of results) {
      if (result.status === "rejected")
        continue
      if (init?.noCheck && result.value.isOk())
        return result.value
      const raw = JSON.stringify(result.value.inner)
      const previous = Option.wrap(counters.get(raw)).unwrapOr(0)
      counters.set(raw, previous + 1)
      fetcheds.set(raw, result.value)
    }

    /**
     * One truth -> return it
     * Zero truth -> throw AggregateError
     */
    if (counters.size < 2)
      return await Promise.any(promises)

    console.warn(`Different results from multiple circuits for ${url}`)

    /**
     * Sort truths by occurence
     */
    const sorteds = [...Maps.entries(counters)].sort((a, b) => b.value - a.value)

    /**
     * Two concurrent truths
     */
    if (sorteds[0].value === sorteds[1].value) {
      console.warn(`Could not choose truth for ${url}`)
      throw new Error(`Could not choose truth`)
    }

    return fetcheds.get(sorteds[0].key)!
  })
}

export namespace BgSignature {

  export const method = "eth_getSignature"

  export function key(hash: ZeroHexString): EthereumQueryKey<unknown> {
    return {
      chainId: 1,
      method: method,
      params: [hash]
    }
  }

  export async function tryParse(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
    const [hash] = (request as RpcRequestPreinit<[ZeroHexString]>).params
    const query = schema(ethereum, hash, storage)
    return new Ok(query)
  }

  export function schema(ethereum: BgEthereumContext, hash: ZeroHexString, storage: IDBStorage) {
    const fetcher = async () => {
      const url = `https://www.4byte.directory/api/v1/signatures/?format=json&hex_signature=${hash}`
      return await tryFetchRaw<SignatureData>(ethereum, url)
    }

    return createQuery<EthereumQueryKey<unknown>, SignatureData, Error>({
      key: key(hash),
      fetcher,
      storage
    })
  }

}