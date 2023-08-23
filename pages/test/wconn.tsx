import { Berith } from "@hazae41/berith";
import { Bytes } from "@hazae41/bytes";
import { Ed25519 } from "@hazae41/ed25519";
import { base58 } from "@scure/base";
import { useCallback, useState } from "react";

export namespace ISS {

  export function encode(bytes: Uint8Array) {
    const multicodec = "z" + "K36" + base58.encode(bytes) // base58.prefix + base58.encode(0xed01 + bytes)

    return `did:key:${multicodec}`
  }

}

export namespace JWT {

  export function prepare(bytes: Uint8Array) {
    const alg = "EdDSA"
    const typ = "JWT"

    const header = { alg, typ }

    const iss = ISS.encode(bytes)
    const sub = Bytes.toHex(Bytes.tryRandom(32).unwrap())
    const aud = "wss://relay.walletconnect.org"
    const iat = Math.floor(Date.now() / 1000)
    const ttl = 24 * 60 * 60 // one day in seconds
    const exp = iat + ttl

    const payload = { iss, sub, aud, iat, exp }

    return { header, payload }
  }

}

export default function Page() {
  const [url, setUrl] = useState<string>()

  const onClick = useCallback(async () => {
    if (!url) return

    Berith.initSyncBundledOnce()

    const ed25519 = await Ed25519.fromSafeOrBerith(Berith)

    const relay = "wss://relay.walletconnect.org"

    const { protocol, pathname, searchParams } = new URL(url)
    const [topic, version] = pathname.split("@")
    const relayProtocol = searchParams.get("relayProtocol")
    const symKey = searchParams.get("symKey")

    const seed = Bytes.tryRandom(32).unwrap()
    const key = Berith.Ed25519Keypair.from_bytes(seed)

    const tbs = JWT.prepare(key.public().to_bytes())

    const auth = "" // TODO
    const projectId = "" // TODO
    const socket = new WebSocket(`${relay}/?auth=${auth}&projectId=${projectId}`)
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