import { Rpc } from "@/libs/rpc"
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { Circuit } from "@hazae41/echalote"
import { Fleche } from "@hazae41/fleche"
import { Future } from "@hazae41/future"

export interface Session {
  circuit: Circuit,
  socket: WebSocket,
  client: Rpc.Client
}

export async function createSession(url: URL, circuit: Circuit, signal?: AbortSignal) {
  const tcp = await circuit.open(url.hostname, 443)
  const tls = new TlsClientDuplex(tcp, { ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384] })
  const socket = new Fleche.WebSocket(url, undefined, { subduplex: tls })

  const future = new Future()

  try {
    socket.addEventListener("open", future.resolve, { passive: true })
    socket.addEventListener("error", future.reject, { passive: true })

    await future.promise
  } finally {
    socket.removeEventListener("open", future.resolve)
    socket.removeEventListener("error", future.reject)
  }

  const client = new Rpc.Client()

  return { circuit, socket, client }
}