import { Result } from "@hazae41/result"

export class WebAuthnStorageError extends Error {
  readonly #class = WebAuthnStorageError
  readonly name = this.#class.name

  constructor(options?: ErrorOptions) {
    super(`Could not use authenticated storage`, options)
  }

  static from(cause: unknown) {
    return new WebAuthnStorageError({ cause })
  }

}

/**
 * Use WebAuthn as a authentication-protected storage of arbitrary bytes
 * This WON'T use the Secure Enclave as it stores the bytes in `userHandle` (probably on disk)
 * 
 * This is used to prevent unauthenticated access to the (encrypted) bytes in the case of:
 * - supply-chain attack where the attacker has the encryption password: it would still require user approval before stealing the private key
 * - phishing, misclick, phone-left-on-the-table attack: it would still require user approval before signing transactions
 */
export namespace WebAuthnStorage {

  export async function tryCreate(name: string, data: Uint8Array): Promise<Result<Uint8Array, WebAuthnStorageError>> {
    return await Result.runAndWrap(async () => {
      return await createOrThrow(name, data)
    }).then(r => r.mapErrSync(WebAuthnStorageError.from))
  }

  export async function createOrThrow(name: string, data: Uint8Array): Promise<Uint8Array> {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array([117, 61, 252, 231, 191, 241]),
        rp: {
          id: location.hostname,
          name: "Brume Wallet"
        },
        user: {
          id: data,
          name: name,
          displayName: name
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -8 },
          { type: "public-key", alg: -257 }
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform"
        }
      }
    }) as any

    return new Uint8Array(credential.rawId)
  }

  export async function tryGet(id: Uint8Array): Promise<Result<Uint8Array, WebAuthnStorageError>> {
    return await Result.runAndWrap(async () => {
      return await getOrThrow(id)
    }).then(r => r.mapErrSync(WebAuthnStorageError.from))
  }

  export async function getOrThrow(id: Uint8Array): Promise<Uint8Array> {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array([117, 61, 252, 231, 191, 241]),
        allowCredentials: [{ type: "public-key", id }],
      }
    }) as any

    return new Uint8Array(credential.response.userHandle)
  }

}