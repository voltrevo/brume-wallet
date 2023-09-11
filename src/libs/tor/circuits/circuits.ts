import { Disposer } from "@hazae41/cleaner"
import { Circuit, TorClientDuplex, createPooledCircuit } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

export namespace Circuits {

  export function createPool<TorPoolError>(tors: Mutex<Pool<Disposer<TorClientDuplex>, TorPoolError>>, params: PoolParams) {
    return new Mutex(new Pool<Disposer<Circuit>, Error | TorPoolError>(async (params) => {
      return await Result.unthrow(async t => {
        const { index, signal } = params

        const tor = await tors.inner.tryGet(index % tors.inner.capacity).then(r => r.throw(t))
        const circuit = await tor.inner.tryCreateAndExtendLoop(signal).then(r => r.throw(t))

        return new Ok(createPooledCircuit(circuit, params))
      })
    }, params))
  }

}
