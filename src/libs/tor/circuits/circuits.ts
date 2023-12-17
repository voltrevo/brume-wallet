import { Results } from "@/libs/results/results"
import { Box } from "@hazae41/box"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Disposer } from "@hazae41/cleaner"
import { Circuit, Consensus, TorClientDuplex, createCircuitEntry } from "@hazae41/echalote"
import { fetch } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { None } from "@hazae41/option"
import { Cancel, Looped, Pool, PoolParams, Retry, tryLoop } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

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
   * @param tors 
   * @param params 
   * @returns 
   */
  export function pool(tors: Pool<TorClientDuplex>, consensus: Consensus, params: PoolParams) {
    const middles = consensus.microdescs.filter(it => true
      && it.flags.includes("Fast")
      && it.flags.includes("Stable")
      && it.flags.includes("V2Dir"))

    const exits = consensus.microdescs.filter(it => true
      && it.flags.includes("Fast")
      && it.flags.includes("Stable")
      && it.flags.includes("Exit")
      && !it.flags.includes("BadExit"))

    let update = Date.now()

    const pool = new Pool<Circuit>(async (params) => {
      while (true) {
        const start = Date.now()

        const result = await Result.unthrow<Result<Disposer<Box<Circuit>>, Error>>(async t => {
          const { index, signal } = params

          const tor = await tors.tryGet(index % tors.capacity, signal).then(r => r.throw(t).throw(t).inner.inner)

          using circuit = await tryLoop<Box<Circuit>, Looped<Error>>(async () => {
            return await Result.unthrow<Result<Box<Circuit>, Looped<Error>>>(async t => {
              using circuit = new Box(await tor.tryCreate(AbortSignal.timeout(1000)).then(r => r.mapErrSync(Cancel.new).throw(t)))

              /**
               * Try to extend to middle relay 9 times before giving up this circuit
               */
              await tryLoop(() => {
                return Result.unthrow<Result<void, Looped<Error>>>(async t => {
                  const head = middles[Math.floor(Math.random() * middles.length)]
                  const body = await Consensus.Microdesc.tryFetch(circuit.inner, head).then(r => r.mapErrSync(Cancel.new).throw(t))
                  await circuit.inner.tryExtend(body, AbortSignal.timeout(1000)).then(r => r.mapErrSync(Retry.new).throw(t))

                  return Ok.void()
                })
              }, { max: 3 }).then(r => r.mapErrSync(Retry.new).throw(t))

              /**
               * Try to extend to exit relay 9 times before giving up this circuit
               */
              await tryLoop(() => {
                return Result.unthrow<Result<void, Looped<Error>>>(async t => {
                  const head = exits[Math.floor(Math.random() * exits.length)]
                  const body = await Consensus.Microdesc.tryFetch(circuit.inner, head).then(r => r.mapErrSync(Cancel.new).throw(t))
                  await circuit.inner.tryExtend(body, AbortSignal.timeout(1000)).then(r => r.mapErrSync(Retry.new).throw(t))

                  return Ok.void()
                })
              }, { max: 3 }).then(r => r.mapErrSync(Retry.new).throw(t))

              /**
               * Try to open a stream to a reliable endpoint
               */
              using stream = await tryOpenAs(circuit.inner, "http://example.com/").then(r => r.mapErrSync(Retry.new).throw(t))

              /**
               * Reliability test
               */
              for (let i = 0; i < 3; i++) {
                /**
                 * Speed test
                 */
                const signal = AbortSignal.timeout(1000)

                await Result.runAndDoubleWrap(async () => {
                  await fetch("http://example.com/", { stream: stream.inner, signal, preventAbort: true, preventCancel: true, preventClose: true }).then(r => r.text())
                }).then(r => r.mapErrSync(Retry.new).throw(t))
              }

              return new Ok(circuit.moveOrThrow())
            })
          }, { max: 9 }).then(r => r.throw(t))

          return new Ok(createCircuitEntry(circuit.moveOrThrow(), params))
        }).then(Results.log)

        if (result.isOk())
          return result

        if (start < update)
          continue

        return result
      }
    }, params)

    tors.events.on("started", async i => {
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
        }).then(Results.log)

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