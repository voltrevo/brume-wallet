import { Bytes } from "@hazae41/bytes"

export namespace Password {

  export async function hash(password: string, salt: Uint8Array) {
    const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name: "PBKDF2" }, false, ["deriveBits"])

    return new Uint8Array(await crypto.subtle.deriveBits({
      name: "PBKDF2",
      salt: salt,
      iterations: 1_000_000,
      hash: "SHA-256"
    }, pbkdf2, 256))
  }

}