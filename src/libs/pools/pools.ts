import { Mutex } from "@hazae41/mutex"
import { Pool } from "@hazae41/piscine"
import { useEffect } from "react"

export namespace Pools {

  export async function takeLocked<T>(pool: Pool<T>) {
    const element = await pool.cryptoRandom()
    pool.delete(element)
    return element
  }

  export async function take<T>(pool: Mutex<Pool<T>>) {
    return await pool.lock(takeLocked)
  }

}

export function usePoolChange<T>(pool: Pool<T> | undefined, callback: (pool: Pool<T>) => void) {
  useEffect(() => {
    if (!pool) return

    const onCreatedOrDeleted = () => callback(pool)

    pool.events.addEventListener("created", onCreatedOrDeleted, { passive: true })
    pool.events.addEventListener("deleted", onCreatedOrDeleted, { passive: true })

    return () => {
      pool.events.removeEventListener("created", onCreatedOrDeleted)
      pool.events.removeEventListener("deleted", onCreatedOrDeleted)
    }
  }, [pool, callback])
}