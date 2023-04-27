import { Mutex } from "@hazae41/mutex"
import { Pool } from "@hazae41/piscine"

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