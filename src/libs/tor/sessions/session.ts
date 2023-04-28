import { Objects } from "@/libs/objects/objects"
import { Pools } from "@/libs/pools/pools"
import { Rpc } from "@/libs/rpc"
import { Sockets } from "@/libs/sockets/sockets"
import { useSessionsPool } from "@/mods/tor/sessions/context"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Circuit } from "@hazae41/echalote"
import { Fleche } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { Pool } from "@hazae41/piscine"
import { Data, getSchema, useOnce, useSchema } from "@hazae41/xswr"

export type EthereumChainID = number

export interface EthereumChain {
  id: EthereumChainID,
  url: string,
  etherscan: string
}

export type EthereumChainMap<T> = {
  [chainId: EthereumChainID]: T
}

export type EthereumSession =
  | EthereumSocketSession

export function getSessions(uuid: string, pool?: Mutex<Pool<EthereumSessions>>) {
  if (!pool) return

  return getSchema(`sessions/${uuid}`, async () => {
    return new Data(await Pools.take(pool))
  }, {})
}

export function useSessions(uuid: string) {
  const pool = useSessionsPool()

  const query = useSchema(getSessions, [uuid, pool])
  useOnce(query)
  return query.data
}

export interface EthereumSessions {
  circuit: Circuit,
  sessions: EthereumChainMap<EthereumSession>
}

export interface EthereumSocketSession {
  chain: EthereumChain
  circuit: Circuit,
  socket: WebSocket
  client: Rpc.Client
}

export namespace EthereumSocketSession {

  /**
   * Create a WebSocket session, and destroy the circuit when it closes
   * @param chain 
   * @param circuit 
   * @param signal 
   * @returns 
   */
  export async function create(chain: EthereumChain, circuit: Circuit, signal?: AbortSignal) {
    const url = new URL(chain.url)

    const tcp = await circuit.open(url.hostname, 443, { signal })
    const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384] })
    const socket = new Fleche.WebSocket(url, undefined, { subduplex: tls })

    await Sockets.wait(socket, "open", signal)

    const client = new Rpc.Client()

    const onCloseOrError = () => {
      socket.removeEventListener("close", onCloseOrError)
      socket.removeEventListener("error", onCloseOrError)

      circuit.destroy()
    }

    socket.addEventListener("close", onCloseOrError, { passive: true })
    socket.addEventListener("error", onCloseOrError, { passive: true })

    return { chain, circuit, socket, client } satisfies EthereumSocketSession
  }

}

/**
 * Create a pool where each element is a **map** of chainId to Ethereum sessions (on the same circuit), where each session corresponds to an Ethereum chain
 * @param chains 
 * @param circuits 
 * @returns 
 */
export function createEthereumSessionsPool(chains: EthereumChainMap<EthereumChain>, circuits: Mutex<Pool<Circuit>>) {
  const { capacity } = circuits.inner

  return new Pool<EthereumSessions>(async ({ pool, signal }) => {
    const circuit = await Pools.take(circuits)

    try {
      const sessions = await Objects.mapValues(chains, (chain) => EthereumSocketSession.create(chain, circuit, signal))

      const sessions2 = { circuit, sessions }

      const onCloseOrError = (e: CloseEvent | ErrorEvent) => {
        circuit.events.removeEventListener("close", onCloseOrError)
        circuit.events.removeEventListener("error", onCloseOrError)

        pool.delete(sessions2)
      }

      circuit.events.addEventListener("close", onCloseOrError, { passive: true })
      circuit.events.addEventListener("error", onCloseOrError, { passive: true })

      return sessions2
    } catch (e: unknown) {
      /**
       * Retry with another circuit
       */
      circuit.destroy()
      throw e
    }
  }, { capacity })
}
