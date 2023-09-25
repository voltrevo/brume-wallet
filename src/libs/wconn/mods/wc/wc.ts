import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { RpcRequestPreinit } from "@/libs/rpc";
import { Base16 } from "@hazae41/base16";
import { Bytes } from "@hazae41/bytes";
import { Future } from "@hazae41/future";
import { None, Option, Some } from "@hazae41/option";
import { Err, Ok, Result } from "@hazae41/result";
import { X25519 } from "@hazae41/x25519";
import { CryptoClient } from "../crypto/client";
import { IrnBrume } from "../irn/irn";

export interface WcMetadata {
  readonly name: string
  readonly description: string
  readonly url: string
  readonly icons: string[]
}

export interface WcSessionProposeParams {
  readonly proposer: {
    /**
     * base16
     */
    readonly publicKey: string
    readonly metadata: WcMetadata
  }

  readonly relays: {
    readonly protocol: string
  }[]

  readonly requiredNamespaces: any
  readonly optionalNamespaces: any
}

export interface WcSessionSettleParams {
  readonly controller: {
    /**
     * base16
     */
    readonly publicKey: string
    readonly metadata: WcMetadata
  }

  readonly relay: {
    readonly protocol: string
  }

  readonly namespaces: any
  readonly requiredNamespaces: any
  readonly optionalNamespaces: any

  readonly pairingTopic: string
  readonly expiry: number
}

export interface WcSessionRequestParams<T = unknown> {
  /**
   * namespace:decimal
   */
  readonly chainId: `${string}:${string}`
  readonly request: RpcRequestPreinit<T>
}

export class WcProposal {

  constructor(
    readonly client: CryptoClient,
    readonly metadata: WcMetadata
  ) { }

}

export class WcSession {

  constructor(
    readonly client: CryptoClient,
    readonly metadata: WcMetadata
  ) { }

  async tryClose(reason: unknown): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      await this.client.tryRequest({
        method: "wc_sessionDelete",
        params: { code: 6000, message: "User disconnected." }
      }).then(r => r.throw(t))

      await this.client.irn.tryClose(reason).then(r => r.throw(t))

      return Ok.void()
    })
  }

}

export interface WcPairParams {
  readonly protocol: "wc:"
  readonly version: "2"
  readonly pairingTopic: string
  readonly relayProtocol: "irn"
  readonly symKey: Bytes<32>
}

export interface WcSessionParams {
  readonly protocol: "wc:"
  readonly version: "2"
  readonly sessionTopic: string
  readonly relayProtocol: "irn"
  readonly symKey: Bytes<32>
}

export namespace Wc {

  export const RELAY = "wss://relay.walletconnect.org"

  export function tryParse(url: URL): Promise<Result<WcPairParams, Error>> {
    return Result.unthrow(async t => {
      const { protocol, pathname, searchParams } = url

      if (protocol !== "wc:")
        return new Err(new Error(`Invalid protocol`))

      const [pairingTopic, version] = pathname.split("@")

      if (version !== "2")
        return new Err(new Error(`Invalid version`))

      const relayProtocol = Option.wrap(searchParams.get("relay-protocol")).ok().throw(t)

      if (relayProtocol !== "irn")
        return new Err(new Error(`Invalid relay protocol`))

      const symKeyHex = Option.wrap(searchParams.get("symKey")).ok().throw(t)
      const symKeyRaw = Base16.get().tryPadStartAndDecode(symKeyHex).throw(t).copyAndDispose()
      const symKey = Bytes.tryCast(symKeyRaw, 32).throw(t)

      return new Ok({ protocol, pairingTopic, version, relayProtocol, symKey })
    })
  }

  export async function tryPair(irn: IrnBrume, params: WcPairParams, address: string): Promise<Result<WcSession, Error>> {
    return await Result.unthrow(async t => {
      const { pairingTopic, symKey } = params

      const pairing = CryptoClient.tryNew(pairingTopic, symKey, irn).throw(t)

      const relay = { protocol: "irn" }

      const selfPrivate = await X25519.get().PrivateKey.tryRandom().then(r => r.throw(t))
      const selfPublic = selfPrivate.tryGetPublicKey().throw(t)

      using selfPublicSlice = await selfPublic.tryExport().then(r => r.throw(t))
      const selfPublicHex = Base16.get().tryEncode(selfPublicSlice.bytes).throw(t)

      await irn.trySubscribe(pairingTopic).then(r => r.throw(t))

      const proposal = await pairing.events.wait("request", async (future: Future<RpcRequestPreinit<WcSessionProposeParams>>, request) => {
        if (request.method !== "wc_sessionPropose")
          return new None()
        future.resolve(request as RpcRequestPreinit<WcSessionProposeParams>)
        return new Some(new Ok({ relay, responderPublicKey: selfPublicHex }))
      }).inner

      using peerPublicSlice = Base16.get().tryPadStartAndDecode(proposal.params.proposer.publicKey).throw(t)
      const peerPublic = await X25519.get().PublicKey.tryImport(peerPublicSlice.bytes).then(r => r.throw(t))

      const sharedRef = await selfPrivate.tryCompute(peerPublic).then(r => r.throw(t))
      using sharedSlice = sharedRef.tryExport().throw(t)

      const hdfk_key = await crypto.subtle.importKey("raw", sharedSlice.bytes, "HKDF", false, ["deriveBits"])
      const hkdf_params = { name: "HKDF", hash: "SHA-256", info: new Uint8Array(), salt: new Uint8Array() }

      const sessionKey = new Uint8Array(await crypto.subtle.deriveBits(hkdf_params, hdfk_key, 8 * 32)) as Bytes<32>
      const sessionTopic = Base16.get().tryEncode(new Uint8Array(await crypto.subtle.digest("SHA-256", sessionKey))).throw(t)
      const session = CryptoClient.tryNew(sessionTopic, sessionKey, irn).throw(t)

      await irn.trySubscribe(sessionTopic).then(r => r.throw(t))

      {
        const { proposer, requiredNamespaces, optionalNamespaces } = proposal.params

        const namespaces = {
          eip155: {
            chains: Object.values(chainByChainId).map(chain => `eip155:${chain.chainId}`),
            methods: ["eth_sendTransaction", "personal_sign", "eth_signTypedData", "eth_signTypedData_v4"],
            events: ["chainChanged", "accountsChanged"],
            accounts: Object.values(chainByChainId).map(chain => `eip155:${chain.chainId}:${address}`)
          }
        }

        const metadata = { name: "Brume", description: "Brume", url: location.origin, icons: [] }
        const controller = { publicKey: selfPublicHex, metadata }
        const expiry = Math.floor((Date.now() + (7 * 24 * 60 * 60 * 1000)) / 1000)
        const params: WcSessionSettleParams = { relay, namespaces, requiredNamespaces, optionalNamespaces, pairingTopic, controller, expiry }

        await session.tryRequestAndWait<boolean>({ method: "wc_sessionSettle", params })
          .then(r => r.throw(t).throw(t))
          .then(Result.assert)
          .then(r => r.throw(t))

        return new Ok(new WcSession(session, proposer.metadata))
      }
    })
  }

}