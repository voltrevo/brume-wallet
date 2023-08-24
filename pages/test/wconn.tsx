import { RpcRequest, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc";
import { Sockets } from "@/libs/sockets/sockets";
import { SafeJson } from "@/libs/wconn/libs/json/json";
import { Ciphertext, Envelope } from "@/libs/wconn/mods/crypto/crypto";
import { Berith } from "@hazae41/berith";
import { Readable } from "@hazae41/binary";
import { Bytes } from "@hazae41/bytes";
import { Future } from "@hazae41/future";
import { None, Option, Some } from "@hazae41/option";
import { AbortedError, ClosedError, ErroredError, SuperEventTarget } from "@hazae41/plume";
import { Err, Ok, Result } from "@hazae41/result";
import { base58, base64url } from "@scure/base";
import { ChaCha20Poly1305 } from "@stablelib/chacha20poly1305";
import { useCallback, useState } from "react";

export namespace JWT {

  export function sign(keypair: Berith.Ed25519Keypair, audience: string) {
    const alg = "EdDSA"
    const typ = "JWT"

    const preheader = { alg, typ }

    const iss = `did:key:z${base58.encode(Bytes.concat([Bytes.fromHex("ed01"), keypair.public().to_bytes()]))}`
    const sub = Bytes.toHex(Bytes.tryRandom(32).unwrap())
    const aud = audience
    const iat = Math.floor(Date.now() / 1000)
    const ttl = 24 * 60 * 60 // one day in seconds
    const exp = iat + ttl

    const prepayload = { iss, sub, aud, iat, exp }

    const header = base64url.encode(Bytes.fromUtf8(SafeJson.stringify(preheader))).replaceAll("=", "")
    const payload = base64url.encode(Bytes.fromUtf8(SafeJson.stringify(prepayload))).replaceAll("=", "")

    const presignature = Bytes.fromUtf8(`${header}.${payload}`)

    const signature = base64url.encode(keypair.sign(presignature).to_bytes()).replaceAll("=", "")

    return `${header}.${payload}.${signature}`
  }

}

export namespace SafeRpc {

  export function prepare<T>(init: RpcRequestPreinit<T>): RpcRequest<T> {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    return new RpcRequest(id, init.method, init.params)
  }

  export async function tryRequest<T>(socket: WebSocket, init: RpcRequestPreinit<unknown>, signal: AbortSignal) {
    const request = prepare(init)

    socket.send(SafeJson.stringify(request))

    const future = new Future<Result<RpcResponse<T>, ClosedError | ErroredError | AbortedError>>()

    const onMessage = async (event: MessageEvent<unknown>) => {
      if (typeof event.data !== "string")
        return
      const response = RpcResponse.from<T>(JSON.parse(event.data))

      if (response.id !== request.id)
        return
      future.resolve(new Ok(response))
    }

    const onError = (e: unknown) => {
      future.resolve(new Err(ErroredError.from(e)))
    }

    const onClose = (e: unknown) => {
      future.resolve(new Err(ClosedError.from(e)))
    }

    const onAbort = () => {
      future.resolve(new Err(AbortedError.from(signal.reason)))
    }

    try {
      socket.addEventListener("message", onMessage, { passive: true })
      socket.addEventListener("close", onClose, { passive: true })
      socket.addEventListener("error", onError, { passive: true })
      signal.addEventListener("abort", onAbort, { passive: true })

      return await future.promise
    } finally {
      socket.removeEventListener("message", onMessage)
      socket.removeEventListener("close", onClose)
      socket.removeEventListener("error", onError)
      signal.removeEventListener("abort", onAbort)
    }

  }

}

const lol = { "id": "726a7d88eda2fc329a0b2f793ede323d90ac0793d5aede7c6e23ed8fd6d8e0fc", "data": { "topic": "2e5745ca13994f4208d1498711163dad6962d13330939ba223066acc2e317dd1", "message": "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", "publishedAt": 1692876455741, "tag": 1100 } }

export class IrnClient {

  readonly subscriptions = new Map<string, string>()

  readonly events = new SuperEventTarget<{
    request: (request: RpcRequestInit<unknown>) => Result<unknown, Error>
  }>()

  constructor(
    readonly socket: WebSocket
  ) {
    socket.addEventListener("message", this.onMessage.bind(this))
  }

  onMessage(event: MessageEvent<unknown>) {
    if (typeof event.data !== "string")
      return
    const json = JSON.parse(event.data) as RpcRequestInit<unknown> | RpcResponseInit<unknown>

    if ("method" in json)
      return this.onRequest(json)
    return
  }

  async onRequest(request: RpcRequestInit<unknown>) {
    const result = await this.tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)
    this.socket.send(SafeJson.stringify(response))
  }

  async tryRouteRequest(request: RpcRequestInit<unknown>) {
    const returned = await this.events.emit("request", [request])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled JSON-RPC request ${request}`))
  }

  async trySubscribe(topic: string): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const subscription = await SafeRpc.tryRequest<string>(this.socket, {
        method: "irn_subscribe",
        params: { topic }
      }, AbortSignal.timeout(5000)).then(r => r.throw(t).throw(t))

      return new Ok(subscription)
    })
  }

}

export interface IrnSubscriptionPayload {
  readonly id: string
  readonly data: {
    readonly topic: string
    readonly message: string
    readonly publishedAt: number
    readonly tag: number
  }
}

export default function Page() {
  const [url = "", setUrl] = useState<string>()

  const onClick = useCallback(async () => {
    if (!url) return

    Berith.initSyncBundledOnce()

    const relay = "wss://relay.walletconnect.org"

    const { protocol, pathname, searchParams } = new URL(url)
    const [topic, version] = pathname.split("@")
    const relayProtocol = Option.unwrap(searchParams.get("relay-protocol"))
    const symKeyHex = Option.unwrap(searchParams.get("symKey"))
    const symKeyBytes = Bytes.fromHexSafe(symKeyHex)
    const symKey = new ChaCha20Poly1305(symKeyBytes)

    const key = new Berith.Ed25519Keypair()

    const auth = JWT.sign(key, "wss://relay.walletconnect.org")
    const projectId = "a6e0e589ca8c0326addb7c877bbb0857"

    const socket = new WebSocket(`${relay}/?auth=${auth}&projectId=${projectId}`)
    await Sockets.tryWaitOpen(socket, AbortSignal.timeout(5000)).then(r => r.unwrap())

    const irn = new IrnClient(socket)

    await irn.trySubscribe(topic).then(r => r.unwrap())

    const message = await irn.events.wait("request", (future: Future<string>, request) => {
      if (request.method !== "irn_subscription")
        return new None()

      const { data } = (request as RpcRequestPreinit<IrnSubscriptionPayload>).params

      if (data.topic !== topic)
        return new None()
      if (data.tag !== 1100)
        return new None()

      future.resolve(data.message)
      return new Some(new Ok(true))
    }).inner

    const bytes = Bytes.fromBase64(message)
    const envelope = Readable.tryReadFromBytes(Envelope, bytes).unwrap()
    const cipher = envelope.fragment.tryReadInto(Ciphertext).unwrap()
    const plain = cipher.tryDecrypt(symKey).unwrap()
    const plaintext = Bytes.toUtf8(plain.fragment.bytes)
    console.log(plaintext)
  }, [url])

  return <>
    <input placeholder="url"
      value={url}
      onChange={e => setUrl(e.currentTarget.value)} />
    <button onClick={onClick}>
      click me
    </button>
  </>
}