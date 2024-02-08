import { Box } from "@hazae41/box"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Disposer } from "@hazae41/disposer"
import { Circuit, Consensus, TorClientDuplex } from "@hazae41/echalote"
import { fetch } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { None } from "@hazae41/option"
import { Cancel, Looped, Pool, PoolCreatorParams, PoolParams, Retry, tryLoop } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

export function createCircuitEntry(circuit: Box<Circuit>, params: PoolCreatorParams<Circuit>) {
  const { pool, index } = params

  const onCloseOrError = async (reason?: unknown) => {
    pool.restart(index)
    return new None()
  }

  circuit.inner.events.on("close", onCloseOrError, { passive: true })
  circuit.inner.events.on("error", onCloseOrError, { passive: true })

  const onEntryClean = () => {
    using postcircuit = circuit

    circuit.inner.events.off("close", onCloseOrError)
    circuit.inner.events.off("error", onCloseOrError)
  }

  return new Disposer(circuit, onEntryClean)
}

export namespace Circuits {

  export async function tryOpenAs(circuit: Circuit, input: RequestInfo | URL) {
    return await Result.runAndDoubleWrap(() => openAsOrThrow(circuit, input))
  }

  export async function openAsOrThrow(circuit: Circuit, input: RequestInfo | URL) {
    const req = new Request(input)
    const url = new URL(req.url)

    if (url.protocol === "http:" || url.protocol === "ws:") {
      const tcp = await circuit.openOrThrow(url.hostname, Number(url.port) || 80)

      return new Disposer(tcp.outer, () => tcp.close())
    }

    if (url.protocol === "https:" || url.protocol === "wss:") {
      const tcp = await circuit.openOrThrow(url.hostname, Number(url.port) || 443)

      const ciphers = [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384, Ciphers.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384]
      const tls = new TlsClientDuplex({ host_name: url.hostname, ciphers })

      tcp.outer.readable.pipeTo(tls.inner.writable).catch(() => { })
      tls.inner.readable.pipeTo(tcp.outer.writable).catch(() => { })

      return new Disposer(tls.outer, () => tcp.close())
    }

    throw new Error(url.protocol)
  }

  /**
   * Create a pool of Circuits modulo a pool of Tor clients
   * @param torsAndConsensus 
   * @param params 
   * @returns 
   */
  export function pool(torsAndConsensus: Pool<Disposer<readonly [TorClientDuplex, Consensus]>>, params: PoolParams) {
    let update = Date.now()

    const pool = new Pool<Circuit>(async (params) => {
      while (true) {
        const start = Date.now()

        const result = await Result.runAndDoubleWrap(async () => {
          const { index, signal } = params

          using circuit = await (async () => {
            while (true) {
              const [tor, consensus] = await torsAndConsensus.getOrThrow(index % torsAndConsensus.capacity, signal).then(r => r.unwrap().inner.inner.inner)

              const middles = consensus.microdescs.filter(it => true
                && it.flags.includes("Fast")
                && it.flags.includes("Stable")
                && it.flags.includes("V2Dir"))

              const exits = consensus.microdescs.filter(it => true
                && it.flags.includes("Fast")
                && it.flags.includes("Stable")
                && it.flags.includes("Exit")
                && !it.flags.includes("BadExit"))

              try {
                using circuit = new Box(await tor.createOrThrow(AbortSignal.timeout(1000)))

                /**
                 * Try to extend to middle relay 3 times before giving up this circuit
                 */
                await tryLoop(() => {
                  return Result.unthrow<Result<void, Looped<Error>>>(async t => {
                    const head = middles[Math.floor(Math.random() * middles.length)]
                    const body = await Consensus.Microdesc.tryFetch(circuit.inner, head).then(r => r.mapErrSync(Cancel.new).throw(t))
                    await circuit.inner.tryExtend(body, AbortSignal.timeout(1000)).then(r => r.mapErrSync(Retry.new).throw(t))

                    return Ok.void()
                  })
                }, { init: 0, base: 0, max: 3 }).then(r => r.unwrap())

                /**
                 * Try to extend to exit relay 3 times before giving up this circuit
                 */
                await tryLoop(() => {
                  return Result.unthrow<Result<void, Looped<Error>>>(async t => {
                    const head = exits[Math.floor(Math.random() * exits.length)]
                    const body = await Consensus.Microdesc.tryFetch(circuit.inner, head).then(r => r.mapErrSync(Cancel.new).throw(t))
                    await circuit.inner.tryExtend(body, AbortSignal.timeout(1000)).then(r => r.mapErrSync(Retry.new).throw(t))

                    return Ok.void()
                  })
                }, { init: 0, base: 0, max: 3 }).then(r => r.unwrap())

                /**
                 * Try to open a stream to a reliable endpoint
                 */
                using stream = await openAsOrThrow(circuit.inner, "http://detectportal.firefox.com")

                /**
                 * Reliability test
                 */
                for (let i = 0; i < 3; i++) {
                  /**
                   * Speed test
                   */
                  const signal = AbortSignal.timeout(1000)

                  await fetch("http://detectportal.firefox.com", { stream: stream.inner, signal, preventAbort: true, preventCancel: true, preventClose: true }).then(r => r.text())
                }

                return circuit.moveOrThrow()
              } catch (e: unknown) {
                console.warn(`Retrying circuit creation`, { e })
                continue
              }
            }
          })()

          return createCircuitEntry(circuit.moveOrThrow(), params)
        }).then(r => r.inspectErrSync(e => console.error(`Circuit creation failed`, { e })))

        if (result.isOk())
          return result

        if (start < update)
          continue

        return result
      }
    }, params)

    torsAndConsensus.events.on("started", async i => {
      update = Date.now()

      for (let i = 0; i < pool.capacity; i++) {
        const child = pool.tryGetSync(i)

        if (child.isErr())
          continue

        if (child.inner.isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }, { passive: true })

    return pool
  }

  /**
   * Create a pool of Circuits stealing from another pool of Circuits
   * @param circuits 
   * @param params 
   * @returns 
   */
  export function subpool(circuits: Mutex<Pool<Circuit>>, params: PoolParams) {
    let update = Date.now()

    const pool = new Pool<Circuit>(async (params) => {
      while (true) {
        const start = Date.now()

        const result = await Result.unthrow<Result<Disposer<Box<Circuit>>, Error>>(async t => {
          using circuit = await Pool.tryTakeCryptoRandom(circuits).then(r => r.throw(t).throw(t).inner)
          return new Ok(createCircuitEntry(circuit.moveOrThrow(), params))
        })

        if (result.isOk())
          return result

        if (start < update)
          continue

        return result
      }
    }, params)

    circuits.inner.events.on("started", async () => {
      update = Date.now()

      for (let i = 0; i < pool.capacity; i++) {
        const child = pool.tryGetSync(i)

        if (child.isErr())
          continue

        if (child.inner.isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }, { passive: true })

    return pool
  }

}