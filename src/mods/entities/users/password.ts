import { Bytes } from "@hazae41/bytes"

export namespace Password {

  export type ParamsBytes =
    | Pbkdf2ParamsBytes

  export type ParamsBase64 =
    | Pbkdf2ParamsBase64

  export interface Pbkdf2ParamsBytes {
    name: "PBKDF2",
    hash: string,
    iterations: number,
    salt: Uint8Array
    length: number
  }

  export interface Pbkdf2ParamsBase64 {
    name: "PBKDF2",
    hash: string,
    iterations: number,
    salt: string
    length: number
  }

  export namespace Pbdkf2Params {
    export function stringify(params: Pbkdf2ParamsBytes): Pbkdf2ParamsBase64 {
      const { name, hash, iterations, length } = params
      const salt = Bytes.toBase64(params.salt)
      return { name, hash, iterations, salt, length }
    }

    export function parse(params: Pbkdf2ParamsBase64): Pbkdf2ParamsBytes {
      const { name, hash, iterations, length } = params
      const salt = Bytes.fromBase64(params.salt)
      return { name, hash, iterations, salt, length }
    }
  }

  export async function pbkdf2(password: string, params: Pbkdf2ParamsBytes) {
    const { name, hash, iterations, salt, length } = params

    const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name }, false, ["deriveBits"])

    return new Uint8Array(await crypto.subtle.deriveBits({ name, hash, iterations, salt }, pbkdf2, length))
  }

}