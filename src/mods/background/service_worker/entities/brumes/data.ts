import { EthereumChain, EthereumChains } from "@/libs/ethereum/mods/chain"
import { Objects } from "@/libs/objects/objects"
import { RpcClient } from "@/libs/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Sockets } from "@/libs/sockets/sockets"
import { BinaryError } from "@hazae41/binary"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { ControllerError } from "@hazae41/cascade"
import { Cleaner } from "@hazae41/cleaner"
import { Circuit } from "@hazae41/echalote"
import { Fleche } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { None, Optional } from "@hazae41/option"
import { Cancel, Looped, Pool, PoolParams, Retry, tryLoop } from "@hazae41/piscine"
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume"
import { Err, Ok, Panic, Result } from "@hazae41/result"
import { createQuerySchema } from "@hazae41/xswr"
import { Wallet } from "../wallets/data"

export type EthereumBrumes =
  Mutex<Pool<EthereumBrume, Error>>

export type Connection = WebSocket | URL

export interface EthereumBrume {
  readonly circuit: Circuit,
  readonly client: RpcClient
  readonly conns: EthereumChains<Optional<Pool<Connection, Error>>>
}

export namespace EthereumBrumes {

  export type Key = ReturnType<typeof key>

  export function key(wallet: Wallet) {
    return `brumes/${wallet.uuid}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(wallet: Wallet) {
    return createQuerySchema<Key, Mutex<Pool<EthereumBrume, Error>>, never>({ key: key(wallet) })
  }

  export function createPool(chains: EthereumChains, circuits: Mutex<Pool<Circuit, Error>>, params: PoolParams) {
    return new Mutex(new Pool<EthereumBrume, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const circuit = await Pool.takeCryptoRandom(circuits).then(r => r.throw(t).result.get())
        const sockets = Objects.mapValuesSync(chains, chain => EthereumConnection.createPool(circuit, chain))
        const client = new RpcClient()

        const brume: EthereumBrume = { circuit, client, conns: sockets }

        const onCloseOrError = async (reason?: unknown) => {
          pool.delete(index)
          return new None()
        }

        brume.circuit.events.on("close", onCloseOrError, { passive: true })
        brume.circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          brume.circuit.events.off("close", onCloseOrError)
          brume.circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Cleaner(brume, onClean))
      })
    }, params))
  }

  export function createSubpool(brumes: Mutex<Pool<EthereumBrume, Error>>, params: PoolParams) {
    return new Mutex(new Pool<EthereumBrume, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index } = params

        const brume = await Pool.takeCryptoRandom(brumes).then(r => r.throw(t).result.get())

        const onCloseOrError = async (reason?: unknown) => {
          pool.delete(index)
          return new None()
        }

        brume.circuit.events.on("close", onCloseOrError, { passive: true })
        brume.circuit.events.on("error", onCloseOrError, { passive: true })

        const onClean = () => {
          brume.circuit.events.off("close", onCloseOrError)
          brume.circuit.events.off("error", onCloseOrError)
        }

        return new Ok(new Cleaner(brume, onClean))
      })
    }, params))
  }

}

export namespace EthereumConnection {

  export async function tryCreate(circuit: Circuit, url: URL, signal?: AbortSignal): Promise<Result<Connection, Looped<Error>>> {
    const result = await Result.unthrow<Result<Connection, BinaryError | ErroredError | ClosedError | AbortedError | ControllerError | Panic>>(async t => {
      const signal2 = AbortSignals.timeout(15_000, signal)

      if (url.protocol === "http:")
        return new Ok(url)
      if (url.protocol === "https:")
        return new Ok(url)

      if (url.protocol === "wss:") {
        const tcp = await circuit.tryOpen(url.hostname, 443).then(r => r.throw(t))
        const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384] })
        const socket = new Fleche.WebSocket(url, undefined, { subduplex: tls })

        await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

        return new Ok(socket)
      }

      if (url.protocol === "ws:") {
        const tcp = await circuit.tryOpen(url.hostname, 80).then(r => r.throw(t))
        const socket = new Fleche.WebSocket(url, undefined, { subduplex: tcp })

        await Sockets.tryWaitOpen(socket, signal2).then(r => r.throw(t))

        return new Ok(socket)
      }

      return new Err(new Panic(`Unknown protocol ${url.protocol}`))
    })

    if (result.isErr())
      console.warn(`Could not create ${url.href} using ${circuit.id}`)

    if (circuit.destroyed)
      return result.mapErrSync(Cancel.new)

    return result.mapErrSync(Retry.new)
  }

  export function createPool(circuit: Circuit, chain: EthereumChain) {
    return new Pool<Connection, Error>(async (params) => {
      return await Result.unthrow(async t => {
        const { pool, index, signal } = params

        const url = new URL(chain.urls[index])

        const connection = await tryLoop(async () => {
          return tryCreate(circuit, url, signal)
        }, { signal }).then(r => r.throw(t))

        if (connection instanceof URL)
          return new Ok(new Cleaner(connection, () => { }))

        const onCloseOrError = () => {
          pool.delete(index)
        }

        connection.addEventListener("close", onCloseOrError, { passive: true })
        connection.addEventListener("error", onCloseOrError, { passive: true })

        const onClean = () => {
          connection.removeEventListener("close", onCloseOrError)
          connection.removeEventListener("error", onCloseOrError)
        }

        return new Ok(new Cleaner(connection, onClean))
      })
    }, { capacity: chain.urls.length })
  }

}