import { Objects } from "@/libs/objects/objects"
import { Pools } from "@/libs/pools/pools"
import { useAsyncMemo } from "@/libs/react/memo"
import { Rpc } from "@/libs/rpc"
import { Sockets } from "@/libs/sockets/sockets"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Circuit } from "@hazae41/echalote"
import { Fleche } from "@hazae41/fleche"
import { Mutex } from "@hazae41/mutex"
import { Pool } from "@hazae41/piscine"

export type EthereumChainID = number

export interface EthereumChain {
  id: EthereumChainID,
  url: string,
  etherscan: string
}

export type EthereumChainMap<T> = {
  [id: EthereumChainID]: T
}

export type EthereumSession =
  | EthereumSocketSession

export interface EthereumSocketSession {
  chain: EthereumChain
  circuit: Circuit,
  socket: WebSocket
  client: Rpc.Client
}

export namespace EthereumSessions {

  export const all = new Map<string, EthereumChainMap<EthereumSession>>()

  export async function getOrTake(uuid: string, pool: Mutex<Pool<EthereumChainMap<EthereumSession>>>) {
    let session = all.get(uuid)
    if (session) return session

    session = await Pools.take(pool)
    all.set(uuid, session)

    // const destroy = () => {
    //   all.delete(path)
    // }

    // session.socket.addEventListener("close", destroy)
    // session.socket.addEventListener("error", destroy)

    return session
  }

}

export function useEthereumSession(uuid: string, pool?: Mutex<Pool<EthereumChainMap<EthereumSession>>>) {
  return useAsyncMemo(async () => {
    if (!pool) return

    return await EthereumSessions.getOrTake(uuid, pool)
  }, [uuid, pool])
}

export namespace EthereumSocketSession {

  export async function create(chain: EthereumChain, circuit: Circuit, signal?: AbortSignal) {
    const url = new URL(chain.url)

    const tcp = await circuit.open(url.hostname, 443, { signal })
    const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384] })
    const socket = new Fleche.WebSocket(url, undefined, { subduplex: tls })

    await Sockets.wait(socket, "open", signal)

    const client = new Rpc.Client()

    return { chain, circuit, socket, client } satisfies EthereumSocketSession
  }

  export function createPool(chains: EthereumChainMap<EthereumChain>, circuits: Mutex<Pool<Circuit>>) {
    const { capacity } = circuits.inner

    return new Pool<EthereumChainMap<EthereumSession>>(async ({ pool, signal }) => {
      const circuit = await Pools.take(circuits)

      return await Objects.mapValues(chains, async (chain) => {
        const session = await create(chain, circuit, signal)

        const onCloseOrError = () => {
          session.socket.removeEventListener("close", onCloseOrError)
          session.socket.removeEventListener("error", onCloseOrError)

          pool.delete(session)
        }

        session.socket.addEventListener("close", onCloseOrError)
        session.socket.addEventListener("error", onCloseOrError)

        return session
      })
    }, { capacity })
  }

}
