import { Bytes } from "@hazae41/bytes"

export interface HmacPbkdf2ParamsBase64 {
  algorithm: Pbkdf2ParamsBase64
  derivedKeyType: HmacParams
}

export interface HmacParams {
  name: "HMAC",
  hash: string
}

export interface AesGcmPbkdf2ParamsBase64 {
  algorithm: Pbkdf2ParamsBase64
  derivedKeyType: AesGcmParams
}

export interface AesGcmParams {
  name: "AES-GCM",
  length: number
}

export interface Pbkdf2ParamsBytes {
  name: "PBKDF2",
  hash: string,
  iterations: number,
  salt: Uint8Array
}

export interface Pbkdf2ParamsBase64 {
  name: "PBKDF2",
  hash: string,
  iterations: number,
  salt: string
}

export namespace Pbdkf2Params {

  export function stringify(params: Pbkdf2ParamsBytes): Pbkdf2ParamsBase64 {
    const { name, hash, iterations } = params
    const salt = Bytes.toBase64(params.salt)
    return { name, hash, iterations, salt }
  }

  export function parse(params: Pbkdf2ParamsBase64): Pbkdf2ParamsBytes {
    const { name, hash, iterations } = params
    const salt = Bytes.fromBase64(params.salt)
    return { name, hash, iterations, salt }
  }

}
