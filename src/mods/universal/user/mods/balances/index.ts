import { Fixed } from "@hazae41/cubane"
import { createQuery, Data, JsonRequest, QueryStorage, States } from "@hazae41/glacier"
import { Option, Some } from "@hazae41/option"

export interface ValueAndCount {
  readonly value: Fixed.From
  readonly count: number
}

export namespace Balance {

  export namespace Priced {

    export namespace Total {

      export type K = JsonRequest.From<undefined>
      export type D = Fixed.From
      export type F = never

      export function keyOrThrow() {
        return new JsonRequest(`app:/balances/total`, { body: undefined })
      }

      export function queryOrThrow(storage: QueryStorage) {
        return createQuery<K, D, F>({ key: keyOrThrow(), storage })
      }

    }

    export namespace Index {

      export type K = JsonRequest.From<undefined>
      export type D = Record<string, ValueAndCount>
      export type F = never

      export function keyOrThrow() {
        return new JsonRequest(`app:/balances/index`, { body: undefined })
      }

      export function queryOrThrow(storage: QueryStorage) {
        const indexer = async (states: States<D, F>) => {
          const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).getOr({})

          const total = Object.values(values).reduce<Fixed>((x, y) => {
            return y.count > 0 ? Fixed.from(y.value).add(x) : x
          }, new Fixed(0n, 0))

          const totalQuery = Total.queryOrThrow(storage)
          await totalQuery!.mutateOrThrow(() => new Some(new Data(total)))
        }

        return createQuery<K, D, F>({
          key: keyOrThrow(),
          indexer,
          storage
        })
      }

    }

  }

}