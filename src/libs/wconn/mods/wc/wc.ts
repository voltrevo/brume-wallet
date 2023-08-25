import { RpcRequestInit, RpcRequestPreinit } from "@/libs/rpc";
import { Sockets } from "@/libs/sockets/sockets";
import { Berith } from "@hazae41/berith";
import { Bytes } from "@hazae41/bytes";
import { Future } from "@hazae41/future";
import { None, Option, Some } from "@hazae41/option";
import { Err, Ok, Result } from "@hazae41/result";
import { CryptoClient } from "../crypto/client";
import { IrnClient } from "../irn/irn";
import { Jwt } from "../jwt/jwt";

export interface WcSessionProposeParams {
  readonly proposer: {
    /**
     * base16
     */
    readonly publicKey: string

    readonly metadata: {
      readonly name: string
      readonly description: string
      readonly url: string
      readonly icons: string[]
    }
  }

  readonly relays: {
    readonly protocol: string
  }[]

  readonly requiredNamespaces: any
  readonly optionalNamespaces: any
}

export interface WcSessionRequestParams<T = unknown> {
  /**
   * namespace:decimal
   */
  readonly chainId: `${string}:${string}`
  readonly request: RpcRequestPreinit<T>
}

export namespace Wc {

  export function tryConnect(url: string) {
    return Result.unthrow<Result<void, Error>>(async t => {
      Berith.initSyncBundledOnce()

      const relay = "wss://relay.walletconnect.org"

      const { protocol, pathname, searchParams } = new URL(url)

      if (protocol !== "wc:")
        return new Err(new Error(`Invalid protocol`))

      const [pairingTopic, version] = pathname.split("@")

      if (version !== "2")
        return new Err(new Error(`Invalid version`))

      const relayProtocol = Option.wrap(searchParams.get("relay-protocol")).ok().throw(t)

      if (relayProtocol !== "irn")
        return new Err(new Error(`Invalid relay protocol`))

      const symKeyHex = Option.wrap(searchParams.get("symKey")).ok().throw(t)
      const symKey = Bytes.fromHexSafe(symKeyHex)
      const symKey32 = Bytes.tryCast(symKey, 32).throw(t)

      const key = new Berith.Ed25519Keypair()

      const auth = Jwt.trySign(key, "wss://relay.walletconnect.org").throw(t)
      const projectId = "a6e0e589ca8c0326addb7c877bbb0857"

      const socket = new WebSocket(`${relay}/?auth=${auth}&projectId=${projectId}`)
      await Sockets.tryWaitOpen(socket, AbortSignal.timeout(5000)).then(r => r.throw(t))

      const irn = new IrnClient(socket)

      await irn.trySubscribe(pairingTopic).then(r => r.throw(t))
      const client = new CryptoClient(pairingTopic, symKey32, irn)

      {
        const relay = { protocol: "irn" }
        const self = new Berith.X25519StaticSecret()

        const proposal = await client.events.wait("request", async (future: Future<RpcRequestPreinit<WcSessionProposeParams>>, request) => {
          if (request.method !== "wc_sessionPropose")
            return new None()
          future.resolve(request as RpcRequestPreinit<WcSessionProposeParams>)

          const responderPublicKey = Bytes.toHex(self.to_public().to_bytes())
          return new Some(new Ok({ relay, responderPublicKey }))
        }).inner

        const peer = Berith.X25519PublicKey.from_bytes(Bytes.fromHexSafe(proposal.params.proposer.publicKey))
        const shared = Bytes.tryCast(self.diffie_hellman(peer).to_bytes(), 32).throw(t)

        const hdfk_key = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveBits"])
        const hkdf_params = { name: "HKDF", hash: "SHA-256", info: new Uint8Array(), salt: new Uint8Array() }
        const key = new Uint8Array(await crypto.subtle.deriveBits(hkdf_params, hdfk_key, 8 * 32)) as Bytes<32>

        const sessionTopic = Bytes.toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", key)))

        await irn.trySubscribe(sessionTopic).then(r => r.throw(t))
        const client2 = new CryptoClient(sessionTopic, key, irn)

        const { requiredNamespaces, optionalNamespaces } = proposal.params

        const namespaces = {
          eip155: {
            chains: ["eip155:1"],
            methods: ["eth_sendTransaction", "personal_sign", "eth_signTypedData", "eth_signTypedData_v4"],
            events: ["chainChanged", "accountsChanged"],
            accounts: ["eip155:1:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"]
          }
        }

        const publicKey = Bytes.toHex(self.to_public().to_bytes())
        const metadata = { name: "Brume", description: "Brume", url: location.origin, icons: [] }
        const controller = { publicKey, metadata }
        const expiry = Math.floor((Date.now() + (7 * 24 * 60 * 60)) / 1000)
        const params = { relay, namespaces, requiredNamespaces, optionalNamespaces, pairingTopic, controller, expiry }

        await client2.tryRequest<boolean>({ method: "wc_sessionSettle", params })
          .then(r => r.throw(t).throw(t))
          .then(Result.assert)
          .then(r => r.setErr(new Error(`false`)).throw(t))

        client2.events.on("request", (suprequest) => {
          if (suprequest.method !== "wc_sessionRequest")
            return new None()
          const { chainId, request } = (suprequest as RpcRequestInit<WcSessionRequestParams>).params

          if (request.method === "eth_sendTransaction")
            return new Some(new Ok("0x9b503ce6b898f4eb41aae3b5eeb3bd47c727ce2b01090b8432dcf43ce8ac0cec"))
          return new None()
        })

        return Ok.void()
      }
    })
  }

}