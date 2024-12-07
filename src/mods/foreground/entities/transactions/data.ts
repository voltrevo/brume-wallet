import { Errors } from "@/libs/errors/errors"
import { useWait } from "@/libs/glacier/hooks"
import { BgTransaction, BgTransactionReceipt, BgTransactionTrial, TransactionRef } from "@/mods/background/service_worker/entities/transactions/data"
import { ZeroHexString } from "@hazae41/cubane"
import { Data, States, createQuery, useError, useQuery } from "@hazae41/glacier"
import { None, Nullable, Some } from "@hazae41/option"
import { UserStorage, useUserStorageContext } from "../../user/mods/storage"
import { FgEthereumContext } from "../wallets/data"

export namespace FgTransaction {

  export namespace All {

    export namespace ByAddress {

      export type K = BgTransaction.All.ByAddress.K
      export type D = BgTransaction.All.ByAddress.D
      export type F = BgTransaction.All.ByAddress.F

      export const key = BgTransaction.All.ByAddress.key

      export function schema(address: Nullable<ZeroHexString>, storage: UserStorage) {
        if (address == null)
          return

        return createQuery<K, D, F>({
          key: key(address),
          storage
        })
      }

    }

  }

  export type K = BgTransaction.K
  export type D = BgTransaction.D
  export type F = BgTransaction.F

  export const key = BgTransaction.key

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      if (previousData?.uuid !== currentData?.uuid) {
        if (previousData != null) {
          await FgTransactionTrial.schema(previousData.trial.uuid, storage)?.mutateOrThrow(s => {
            const current = s.real?.current

            if (current == null)
              return new None()
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(d => ({ ...d, transactions: d.transactions.filter(t => t.uuid !== uuid) })))
          })

          await All.ByAddress.schema(previousData.params.from, storage)?.mutateOrThrow(s => {
            const current = s.real?.current

            if (current == null)
              return new None()
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(d => d.filter(t => t.uuid !== uuid)))
          })
        }

        if (currentData != null) {
          await FgTransactionTrial.schema(currentData.trial.uuid, storage)?.mutateOrThrow(s => {
            const current = s.real?.current

            if (current == null) {
              const uuid = currentData.trial.uuid
              const nonce = currentData.params.nonce
              const transactions = [TransactionRef.from(currentData)]

              const inner = { type: "draft", uuid, nonce, transactions } as const

              return new Some(new Data(inner))
            }

            if (current.isErr())
              return new None()

            return new Some(current.mapSync(d => ({ ...d, transactions: [...d.transactions, TransactionRef.from(currentData)] })))
          })

          await All.ByAddress.schema(currentData.params.from, storage)?.mutateOrThrow(s => {
            const current = s.real?.current

            if (current == null)
              return new Some(new Data([TransactionRef.from(currentData)]))
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(d => [...d, TransactionRef.from(currentData)]))
          })
        }
      }

      if (currentData?.type === "executed") {
        await FgTransactionTrial.schema(currentData.trial.uuid, storage)?.mutateOrThrow(s => {
          const current = s.real?.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(d => ({ ...d, transaction: TransactionRef.from(currentData) })))
        })
      }
    }

    return createQuery<K, D, F>({
      key: key(uuid),
      storage,
      indexer
    })
  }

}

export function useTransactions(address: Nullable<ZeroHexString>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgTransaction.All.ByAddress.schema, [address, storage])

  return query
}

export function useTransactionWithReceipt(uuid: Nullable<string>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()

  const transactionQuery = useQuery(FgTransaction.schema, [uuid, storage])
  const maybeTransaction = transactionQuery.current?.getOrNull()
  useError(transactionQuery, Errors.onQueryError)

  const receiptQuery = useQuery(FgTransactionReceipt.schema, [uuid, maybeTransaction?.hash, context, storage])
  useWait(receiptQuery, 1000)
  useError(receiptQuery, Errors.onQueryError)

  return transactionQuery
}

export namespace FgTransactionTrial {

  export type K = BgTransactionTrial.K
  export type D = BgTransactionTrial.D
  export type F = BgTransactionTrial.F

  export const key = BgTransactionTrial.key

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    return createQuery<K, D, F>({
      key: key(uuid),
      storage
    })
  }

}

export function useTransactionTrial(uuid: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgTransactionTrial.schema, [uuid, storage])

  return query
}

export namespace FgTransactionReceipt {

  export type K = BgTransactionReceipt.K
  export type D = BgTransactionReceipt.D
  export type F = BgTransactionReceipt.F

  export const key = BgTransactionReceipt.key

  export function schema(uuid: Nullable<string>, hash: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
    if (context == null)
      return
    if (hash == null)
      return

    const fetcher = async (request: K) =>
      await context.fetchOrThrow<D>(request)

    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      if (previousData == null && currentData != null) {
        await FgTransaction.schema(uuid, storage)?.mutateOrThrow(s => {
          const current = s.real?.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(d => ({ ...d, type: "executed", receipt: currentData }) as const))
        })
      }
    }

    return createQuery<K, D, F>({
      key: key(hash, context.chain),
      fetcher,
      indexer,
      storage
    })
  }

}
