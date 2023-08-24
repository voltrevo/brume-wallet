import { RpcRequest, RpcRequestPreinit, RpcResponse } from "@/libs/rpc";
import { Sockets } from "@/libs/sockets/sockets";
import { SafeJson } from "@/libs/wconn/libs/json/json";
import { Berith } from "@hazae41/berith";
import { Bytes } from "@hazae41/bytes";
import { Future } from "@hazae41/future";
import { AbortedError, ClosedError, ErroredError } from "@hazae41/plume";
import { Err, Ok, Result } from "@hazae41/result";
import { base58, base64url } from "@scure/base";
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

    const onMessage = async (event: Event) => {
      const msgEvent = event as MessageEvent<string>
      const response = RpcResponse.from<T>(JSON.parse(msgEvent.data))

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

export namespace Iridium {

  export function tryPublish() {

  }

  export function trySubscribe(socket: WebSocket, topic: string) {
    return SafeRpc.tryRequest<string>(socket, {
      method: "irn_subscribe",
      params: { topic }
    }, AbortSignal.timeout(5000))
  }

  export function tryUnsubscribe() {

  }

}

export default function Page() {
  const [url, setUrl] = useState<string>()

  const onClick = useCallback(async () => {
    if (!url) return

    Berith.initSyncBundledOnce()

    const relay = "wss://relay.walletconnect.org"

    const { protocol, pathname, searchParams } = new URL(url)
    const [topic, version] = pathname.split("@")
    const relayProtocol = searchParams.get("relayProtocol")
    const symKey = searchParams.get("symKey")

    const key = new Berith.Ed25519Keypair()

    const auth = JWT.sign(key, "wss://relay.walletconnect.org")
    const projectId = "a6e0e589ca8c0326addb7c877bbb0857"

    const socket = new WebSocket(`${relay}/?auth=${auth}&projectId=${projectId}`)
    await Sockets.tryWaitOpen(socket, AbortSignal.timeout(5000)).then(r => r.unwrap())

    const subscription = await Iridium.trySubscribe(socket, topic).then(r => r.unwrap().unwrap())

    console.log(subscription)
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