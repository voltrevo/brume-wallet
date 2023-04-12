export namespace Sha256 {

  export async function digest(bytes: Uint8Array) {
    return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))
  }

}