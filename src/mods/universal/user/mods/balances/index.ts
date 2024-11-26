import { Fixed } from "@hazae41/cubane"
import { createQuery, Data, QueryStorage, States } from "@hazae41/glacier"
import { Option, Some } from "@hazae41/option"

export class LegacyRequest extends Request {

  constructor(
    readonly key: string
  ) {
    super(key)
  }

  toJSON() {
    return this.key
  }

}

export interface ValueAndCount {
  readonly value: Fixed.From
  readonly count: number
}

export namespace Balance {

  export namespace Priced {

    export namespace Total {

      export type K = string
      export type D = Fixed.From
      export type F = never

      export function keyOrThrow() {
        return `totalPricedBalance/usd`
      }

      export function queryOrThrow(storage: QueryStorage) {
        return createQuery<K, D, F>({ key: keyOrThrow(), storage })
      }

    }

    export namespace Index {

      export type K = string
      export type D = Record<string, ValueAndCount>
      export type F = never

      export function keyOrThrow() {
        return `totalPricedBalanceByWallet/v2/usd`
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