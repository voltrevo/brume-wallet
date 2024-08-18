import { ping } from "@/libs/ping"
import { MicrodescQuery } from "@/mods/universal/entities/microdescs/data"
import { Arrays } from "@hazae41/arrays"
import { Box } from "@hazae41/box"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Disposer } from "@hazae41/disposer"
import { Circuit, TorClientDuplex } from "@hazae41/echalote"
import { fetch } from "@hazae41/fleche"
import { Storage } from "@hazae41/glacier"
import { Mutex } from "@hazae41/mutex"
import { None, Option } from "@hazae41/option"
import { Pool, Retry, loopOrThrow } from "@hazae41/piscine"
import { Result } from "@hazae41/result"

export namespace Circuits {

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

  export function createCircuitEntry(pool: Pool<Circuit>, index: number, circuit: Box<Circuit>) {
    using stack = new Box(new DisposableStack())

    stack.getOrThrow().use(circuit)

    const onCloseOrError = async (reason?: unknown) => {
      pool.restart(index)
      return new None()
    }

    stack.getOrThrow().defer(circuit.getOrThrow().events.on("close", onCloseOrError, { passive: true }))
    stack.getOrThrow().defer(circuit.getOrThrow().events.on("error", onCloseOrError, { passive: true }))

    const unstack = stack.unwrapOrThrow()

    return new Disposer(circuit, () => unstack.dispose())
  }

  /**
   * Create a pool of Circuits modulo a pool of Tor clients
   * @param tors 
   * @param params 
   * @returns 
   */
  export function createCircuitPool(tors: Mutex<Pool<TorClientDuplex>>, storage: Storage, size: number) {
    let update = Date.now()

    const pool: Pool<Circuit> = new Pool<Circuit>(async (params) => {
      const { index, signal } = params

      while (!signal.aborted) {
        const start = Date.now()

        const result = await Result.runAndDoubleWrap(async () => {
          using circuit = await loopOrThrow(async () => {
            let start = Date.now()

            const tor = await tors.inner.getOrThrow(index % tors.inner.length, signal)

            const microdescsQuery = MicrodescQuery.All.create(undefined, storage)
            const microdescsData = await microdescsQuery.state.then(r => Option.unwrap(r.current?.unwrap()))

            const middles = microdescsData.filter(it => true
              && it.flags.includes("Fast")
              && it.flags.includes("Stable")
              && it.flags.includes("V2Dir"))

            const exits = microdescsData.filter(it => true
              && it.flags.includes("Fast")
              && it.flags.includes("Stable")
              && it.flags.includes("Exit")
              && !it.flags.includes("BadExit"))

            try {
              start = Date.now()
              using circuit = new Box(await tor.createOrThrow(AbortSignal.timeout(ping.value * 2)))
              console.debug(`Created circuit #${index} in ${Date.now() - start}ms`)

              /**
               * Try to extend to middle relay 3 times before giving up this circuit
               */
              await loopOrThrow(async () => {
                const head = Arrays.cryptoRandom(middles)!

                const query = Option.unwrap(MicrodescQuery.create(head, index, circuit.getOrThrow(), storage))
                const body = await query.fetch().then(r => Option.unwrap(r.getAny().current).unwrap())

                start = Date.now()
                await Retry.run(() => circuit.getOrThrow().extendOrThrow(body, AbortSignal.timeout(ping.value * 3)))
                console.debug(`Extended circuit #${index} in ${Date.now() - start}ms`)
              }, { max: 3 })

              /**
               * Try to extend to exit relay 3 times before giving up this circuit
               */
              await loopOrThrow(async () => {
                const head = Arrays.cryptoRandom(exits)!

                const query = Option.unwrap(MicrodescQuery.create(head, index, circuit.getOrThrow(), storage))
                const body = await query.fetch().then(r => Option.unwrap(r.getAny().current).unwrap())

                start = Date.now()
                await Retry.run(() => circuit.getOrThrow().extendOrThrow(body, AbortSignal.timeout(ping.value * 4)))
                console.debug(`Extended circuit #${index} in ${Date.now() - start}ms`)
              }, { max: 3 })

              /**
               * Try to open a stream to a reliable endpoint
               */
              using stream = await openAsOrThrow(circuit.getOrThrow(), "http://detectportal.firefox.com")

              /**
               * Reliability test
               */
              for (let i = 0; i < 3; i++) {
                /**
                 * Speed test
                 */
                const signal = AbortSignal.timeout(ping.value * 5)

                start = Date.now()
                await fetch("http://detectportal.firefox.com", { stream: stream.inner, signal, preventAbort: true, preventCancel: true, preventClose: true }).then(r => r.text())
                console.debug(`Fetched portal #${index} in ${Date.now() - start}ms`)
              }

              return circuit.moveOrThrow()
            } catch (e: unknown) {
              console.warn(`Retrying circuit #${index} creation`, { e })
              throw new Retry(e)
            }
          }, { max: 9 })

          console.debug(`Added circuit #${index} in ${Date.now() - start}ms`)
          console.debug(`Circuits pool is now ${[...pool.okEntries].length}/${pool.length}`)

          return createCircuitEntry(pool, index, circuit.moveOrThrow())
        }).then(r => r.inspectErrSync(e => console.error(`Circuit creation failed`, { e })))

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }

      throw new Error("Aborted", { cause: signal.reason })
    })

    const stack = new DisposableStack()

    const onStarted = () => {
      update = Date.now()

      for (let i = 0; i < pool.length; i++) {
        const slot = Result.runAndWrapSync(() => pool.getRawSyncOrThrow(i))

        if (slot.isErr())
          continue

        if (slot.get().isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }

    tors.inner.events.on("started", onStarted, { passive: true })
    stack.defer(() => tors.inner.events.off("started", onStarted))

    for (let i = 0; i < size; i++)
      pool.start(i)

    return new Disposer(pool, () => stack.dispose())
  }

  /**
   * Create a pool of Circuits stealing from another pool of Circuits
   * @param circuits 
   * @param params 
   * @returns 
   */
  export function createCircuitSubpool(circuits: Mutex<Pool<Circuit>>, size: number) {
    let update = Date.now()

    const pool: Pool<Circuit> = new Pool<Circuit>(async (params) => {
      const { index, signal } = params

      while (!signal.aborted) {
        const start = Date.now()

        const result = await Result.runAndWrap(async () => {
          const circuit = await Pool.takeCryptoRandomOrThrow(circuits, signal)
          return createCircuitEntry(pool, index, new Box(circuit))
        })

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }

      throw new Error("Aborted", { cause: signal.reason })
    })

    const stack = new DisposableStack()

    const onStarted = async () => {
      update = Date.now()

      for (let i = 0; i < pool.length; i++) {
        const slot = Result.runAndWrapSync(() => pool.getRawSyncOrThrow(i))

        if (slot.isErr())
          continue

        if (slot.get().isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }

    circuits.inner.events.on("started", onStarted, { passive: true })
    stack.defer(() => circuits.inner.events.off("started", onStarted))

    for (let i = 0; i < size; i++)
      pool.start(i)

    return new Disposer(pool, () => stack.dispose())
  }

}