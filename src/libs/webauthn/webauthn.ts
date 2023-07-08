import { Ok, Result } from "@hazae41/result"

/**
 * Use WebAuthn as a authentication-protected storage of arbitrary bytes
 * This WON'T use the Secure Enclave as it stores the bytes in `userHandle` (probably on disk)
 * 
 * This is used to prevent unauthenticated access to the (encrypted) bytes in the case of:
 * - supply-chain attack where the attacker has the encryption password: it would still require user approval before stealing the private key
 * - phishing, misclick, phone-left-on-the-table attack: it would still require user approval before signing transactions
 */
export namespace WebAuthnStorage {

  export async function create(name: string, data: Uint8Array): Promise<Result<Uint8Array, Error>> {
    return await Result.unthrow(async t => {

      const options: CredentialCreationOptions = {
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
      }

      const credential = await Result.catchAndWrap(async () => {
        return await navigator.credentials.create(options) as any
      }).then(r => r.throw(t))

      return new Ok(new Uint8Array(credential.rawId))
    })
  }

  export async function get(id: Uint8Array): Promise<Result<Uint8Array, Error>> {
    return await Result.unthrow(async t => {

      const options: CredentialRequestOptions = {
        publicKey: {
          challenge: new Uint8Array([117, 61, 252, 231, 191, 241]),
          allowCredentials: [{ type: "public-key", id }],
        }
      }

      const credential = await Result.catchAndWrap(async () => {
        return await navigator.credentials.get(options) as any
      }).then(r => r.throw(t))

      return new Ok(credential.response.userHandle)
    })
  }
}