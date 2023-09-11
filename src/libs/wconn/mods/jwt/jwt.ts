import { Base16 } from "@hazae41/base16"
import { Bytes } from "@hazae41/bytes"
import { Ed25519 } from "@hazae41/ed25519"
import { Ok, Result } from "@hazae41/result"
import { base58, base64url } from "@scure/base"
import { SafeJson } from "../json/json"

export namespace Jwt {

  export async function trySign(privateKey: Ed25519.PrivateKey, audience: string): Promise<Result<string, Error>> {
    return Result.unthrow(async t => {
      const alg = "EdDSA"
      const typ = "JWT"

      const preheader = { alg, typ }

      const prefix = new Uint8Array([0xed, 0x01])

      const publicKey = await Promise.resolve(privateKey.tryGetPublicKey()).then(r => r.throw(t))
      const publicKeyBytes = await Promise.resolve(publicKey.tryExport()).then(r => r.throw(t).copyAndDispose())

      const iss = `did:key:z${base58.encode(Bytes.concat([prefix, publicKeyBytes]))}`
      const sub = Base16.get().tryEncode(Bytes.tryRandom(32).throw(t)).throw(t)
      const aud = audience
      const iat = Math.floor(Date.now() / 1000)
      const ttl = 24 * 60 * 60 // one day in seconds
      const exp = iat + ttl

      const prepayload = { iss, sub, aud, iat, exp }

      const header = base64url.encode(Bytes.fromUtf8(SafeJson.stringify(preheader))).replaceAll("=", "")
      const payload = base64url.encode(Bytes.fromUtf8(SafeJson.stringify(prepayload))).replaceAll("=", "")

      const presignature = Bytes.fromUtf8(`${header}.${payload}`)

      const signatureRef = await Promise.resolve(privateKey.trySign(presignature)).then(r => r.throw(t))
      using signatureSlice = await Promise.resolve(signatureRef.tryExport()).then(r => r.throw(t))

      const signature = base64url.encode(signatureSlice.bytes).replaceAll("=", "")

      return new Ok(`${header}.${payload}.${signature}`)
    })
  }

}