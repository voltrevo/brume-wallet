import { Circuit, TorClientDuplex, createPooledCircuit } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

export function createCircuitPool<TorPoolError>(tors: Mutex<Pool<TorClientDuplex, TorPoolError>>, params: PoolParams = {}) {
  const pool = new Mutex(new Pool<Circuit, Error | TorPoolError>(async (params) => {
    return await Result.unthrow(async t => {
      const { index, signal } = params

      const tor = await tors.inner.tryGet(index % tors.inner.capacity).then(r => r.throw(t))
      const circuit = await tor.tryCreateAndExtendLoop(signal).then(r => r.throw(t))

      return new Ok(createPooledCircuit(circuit, params))
    })
  }, params))

  pool.inner.signal.addEventListener("abort", async (reason) => {
    tors.inner.abort(reason)

    return Ok.void()
  }, { passive: true, once: true })

  tors.inner.signal.addEventListener("abort", async (reason) => {
    pool.inner.abort(reason)

    return Ok.void()
  }, { passive: true, once: true })

  return pool
}