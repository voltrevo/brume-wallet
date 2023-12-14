import { Maps } from "@/libs/maps/maps";
import { AbortSignals } from "@/libs/signals/signals";
import { Circuits } from "@/libs/tor/circuits/circuits";
import { ZeroHexString } from "@hazae41/cubane";
import { fetch } from "@hazae41/fleche";
import { Data, Fail, Fetched, FetcherMore, IDBStorage, createQuery } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Option } from "@hazae41/option";
import { Catched, Err, Ok, Result } from "@hazae41/result";
import { BgEthereumContext, EthereumFetchParams, EthereumQueryKey } from "../wallets/data";

export type ApiResult<T> =
  | ApiOk<T>
  | ApiErr

export interface ApiOk<T> {
  readonly ok: true,
  readonly result: T
}

export interface ApiErr {
  readonly ok: false,
  readonly error: unknown
}

export class ApiError extends Error {
  readonly #class = ApiError
  readonly name = this.#class.name

  constructor(options: ErrorOptions) {
    super(`Could not fetch`, options)
  }

  static from(cause: unknown) {
    return new ApiError({ cause })
  }

}

export interface ApiData {
  readonly event: Record<string, unknown>,
  readonly function: Record<string, ApiFunction[]>
}

export interface ApiFunction {
  readonly name: string
  readonly filtered: boolean
}

export interface SignatureData {
  /**
   * Signature
   */
  readonly name: string
}

export async function tryFetchRaw<T>(ethereum: BgEthereumContext, url: string, init: EthereumFetchParams, more: FetcherMore = {}) {
  return await Result.runAndDoubleWrap<Fetched<T, Error>>(async () => {
    const { signal: presignal } = more
    const { brume } = ethereum

    const circuits = Option.wrap(brume.circuits).ok().unwrap()

    async function runWithPoolOrThrow(index: number) {
      return await Result.unthrow<Result<T, Error>>(async t => {
        const circuit = await circuits.tryGet(index).then(r => r.unwrap().unwrap().inner)

        const signal = AbortSignals.timeout(5_000, presignal)

        using stream = await Circuits.openAsOrThrow(circuit.inner, url)
        const res = await fetch(url, { signal, stream: stream.inner })

        if (!res.ok) {
          const text = await Result.runAndDoubleWrap(() => {
            return res.text()
          }).then(r => r.throw(t))

          return new Err(new Error(text))
        }

        const json = await Result.runAndDoubleWrap(async () => {
          return await res.json() as T
        }).then(r => r.throw(t))

        return new Ok(json)
      }).then(r => Fetched.rewrap(r))
    }

    const promises = Array.from({ length: circuits.capacity }, (_, i) => runWithPoolOrThrow(i))

    const results = await Promise.allSettled(promises)

    const fetcheds = new Map<string, Fetched<T, Error>>()
    const counters = new Map<string, number>()

    for (const result of results) {
      if (result.status === "rejected")
        continue
      if (result.value.isErr())
        continue
      if (init?.noCheck)
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
      version: 3,
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
    const fetcher = async (key: unknown, more: FetcherMore) => {
      try {
        const url = `https://sig.eth.samczsun.com/api/v1/signatures?function=${hash}`
        const fetched = await tryFetchRaw<ApiResult<ApiData>>(ethereum, url, {}, more).then(r => r.unwrap())

        if (fetched.isErr())
          return fetched

        const result = fetched.unwrap()

        if (!result.ok)
          return new Fail(ApiError.from(result.error))

        return new Data(result.result.function[hash])
      } catch (e: unknown) {
        return new Fail(Catched.from(e))
      }
    }

    return createQuery<EthereumQueryKey<unknown>, SignatureData[], Error>({
      key: key(hash),
      fetcher,
      storage
    })
  }

}