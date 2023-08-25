import { Berith } from "@hazae41/berith"
import { Bytes } from "@hazae41/bytes"
import { Ok, Result } from "@hazae41/result"
import { base58, base64url } from "@scure/base"
import { SafeJson } from "../json/json"

export namespace Jwt {

  export function trySign(keypair: Berith.Ed25519Keypair, audience: string): Result<string, Error> {
    return Result.unthrowSync(t => {
      const alg = "EdDSA"
      const typ = "JWT"

      const preheader = { alg, typ }

      const iss = `did:key:z${base58.encode(Bytes.concat([Bytes.fromHex("ed01"), keypair.public().to_bytes()]))}`
      const sub = Bytes.toHex(Bytes.tryRandom(32).throw(t))
      const aud = audience
      const iat = Math.floor(Date.now() / 1000)
      const ttl = 24 * 60 * 60 // one day in seconds
      const exp = iat + ttl

      const prepayload = { iss, sub, aud, iat, exp }

      const header = base64url.encode(Bytes.fromUtf8(SafeJson.stringify(preheader))).replaceAll("=", "")
      const payload = base64url.encode(Bytes.fromUtf8(SafeJson.stringify(prepayload))).replaceAll("=", "")

      const presignature = Bytes.fromUtf8(`${header}.${payload}`)

      const signature = base64url.encode(keypair.sign(presignature).to_bytes()).replaceAll("=", "")

      return new Ok(`${header}.${payload}.${signature}`)
    })
  }

}