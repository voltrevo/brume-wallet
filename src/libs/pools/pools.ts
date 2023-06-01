import { Pool, PoolEntry } from "@hazae41/piscine"
import { Result } from "@hazae41/result"
import { useEffect } from "react"

export function usePoolChange<T, E>(pool: Pool<T, E> | undefined, callback: (pool: Pool<T, E>, entry: PoolEntry<T, E>) => Result<void, unknown>) {
  useEffect(() => {
    if (!pool) return

    const onCreatedOrDeleted = (entry: PoolEntry<T, E>) => callback(pool, entry)

    pool.events.on("created", onCreatedOrDeleted, { passive: true })
    pool.events.on("deleted", onCreatedOrDeleted, { passive: true })

    return () => {
      pool.events.off("created", onCreatedOrDeleted)
      pool.events.off("deleted", onCreatedOrDeleted)
    }
  }, [pool, callback])
}