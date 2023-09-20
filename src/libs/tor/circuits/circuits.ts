import { Disposer } from "@hazae41/cleaner"
import { Circuit, TorClientDuplex, createPooledCircuitDisposer } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

export namespace Circuits {

  /**
   * Create a pool of Circuits modulo a pool of Tor clients
   * @param tors 
   * @param params 
   * @returns 
   */
  export function createPool<TorPoolError>(tors: Pool<Disposer<TorClientDuplex>, TorPoolError>, params: PoolParams) {
    return new Pool<Disposer<Circuit>, Error | TorPoolError>(async (params) => {
      return await Result.unthrow(async t => {
        const { index, signal } = params

        const tor = await tors
          .tryGet(index % tors.capacity)
          .then(r => r.throw(t).inner)

        const circuit = await tor
          .tryCreateAndExtendLoop(signal)
          .then(r => r.throw(t))

        return new Ok(createPooledCircuitDisposer(circuit, params))
      })
    }, params)
  }

  /**
   * Create a pool of Circuits stealing from another pool of Circuits
   * @param circuits 
   * @param params 
   * @returns 
   */
  export function createSubpool(circuits: Mutex<Pool<Disposer<Circuit>, Error>>, params: PoolParams) {
    return new Pool<Disposer<Circuit>, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const circuit = await Pool
          .takeCryptoRandom(circuits)
          .then(r => r.throw(t).result.get().inner)

        return new Ok(createPooledCircuitDisposer(circuit, params))
      })
    }, params)
  }

}
