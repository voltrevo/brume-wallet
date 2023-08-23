import { SafeJson } from "@/libs/wconn/libs/json/json";
import { Berith } from "@hazae41/berith";
import { Bytes } from "@hazae41/bytes";
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

    setTimeout(() => socket.send("hello"), 1000)
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