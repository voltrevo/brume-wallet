import { Disposer } from "@hazae41/cleaner"
import { Circuit, TorClientDuplex, createPooledCircuitDisposer } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { None } from "@hazae41/option"
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
        const { pool, index, signal } = params

        const tor = await tors.tryGetOrWait(index % tors.capacity).then(r => r.inspectErrSync(() => {
          tors.events.on("started", async i => {
            if (i !== (index % tors.capacity))
              return new None()
            await pool.restart(index)
            return new None()
          }, { passive: true, once: true })
        }).throw(t).inner)

        const circuit = await tor.tryCreateAndExtendLoop(signal).then(r => r.throw(t))

        const onCloseOrError = async (reason?: unknown) => {
          console.log("circuit closed")
          await pool.restart(index)
          console.log("circuit restarted")
          return new None()
        }

        circuit.events.on("close", onCloseOrError, { passive: true })
        circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          circuit.events.off("close", onCloseOrError)
          circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Disposer(circuit, onClean))
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
        const { pool, index } = params

        while (true) {
          const circuit = await Pool.takeCryptoRandom(circuits).then(r => r.inspectErrSync(() => {
            circuits.inner.events.on("started", async i => {
              console.log("retrying to steal circuit")
              await pool.restart(index)
              return new None()
            }, { passive: true, once: true })
          }).throw(t).result.get().inner)

          /**
           * TODO fix pooling
           */
          if (circuit.destroyed) {
            console.warn("Circuit already destroyed")
            await new Promise(ok => setTimeout(ok, 1000))
            continue
          }

          return new Ok(createPooledCircuitDisposer(circuit, params as any))
        }
      })
    }, params)
  }

}
