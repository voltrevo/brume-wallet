import { Errors } from "@/libs/errors/errors";
import { RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc";
import { Ciphertext, Envelope, EnvelopeTypeZero, Plaintext } from "@/libs/wconn/mods/crypto/crypto";
import { SafeJson } from "@/libs/wconn/mods/json/json";
import { Base64 } from "@hazae41/base64";
import { Opaque, Readable, Writable } from "@hazae41/binary";
import { Bytes } from "@hazae41/bytes";
import { ChaCha20Poly1305 } from "@hazae41/chacha20poly1305";
import { Future } from "@hazae41/future";
import { None, Some } from "@hazae41/option";
import { SuperEventTarget } from "@hazae41/plume";
import { Err, Ok, Result } from "@hazae41/result";
import { IrnClient, IrnSubscriptionPayload } from "../irn/irn";
import { SafeRpc } from "../rpc/rpc";

export interface RpcOpts {
  readonly prompt: boolean
  readonly ttl: number
  readonly tag: number
}

export const ENGINE_RPC_OPTS: Record<string, { req: RpcOpts, res: RpcOpts }> = {
  wc_sessionPropose: {
    req: {
      ttl: 5 * 60,
      prompt: true,
      tag: 1100,
    },
    res: {
      ttl: 5 * 60,
      prompt: false,
      tag: 1101,
    },
  },
  wc_sessionSettle: {
    req: {
      ttl: 5 * 60,
      prompt: false,
      tag: 1102,
    },
    res: {
      ttl: 5 * 60,
      prompt: false,
      tag: 1103,
    },
  },
  wc_sessionUpdate: {
    req: {
      ttl: 24 * 60 * 60,
      prompt: false,
      tag: 1104,
    },
    res: {
      ttl: 24 * 60 * 60,
      prompt: false,
      tag: 1105,
    },
  },
  wc_sessionExtend: {
    req: {
      ttl: 24 * 60 * 60,
      prompt: false,
      tag: 1106,
    },
    res: {
      ttl: 24 * 60 * 60,
      prompt: false,
      tag: 1107,
    },
  },
  wc_sessionRequest: {
    req: {
      ttl: 5 * 60,
      prompt: true,
      tag: 1108,
    },
    res: {
      ttl: 5 * 60,
      prompt: false,
      tag: 1109,
    },
  },
  wc_sessionEvent: {
    req: {
      ttl: 5 * 60,
      prompt: true,
      tag: 1110,
    },
    res: {
      ttl: 5 * 60,
      prompt: false,
      tag: 1111,
    },
  },
  wc_sessionDelete: {
    req: {
      ttl: 24 * 60 * 60,
      prompt: false,
      tag: 1112,
    },
    res: {
      ttl: 24 * 60 * 60,
      prompt: false,
      tag: 1113,
    },
  },
  wc_sessionPing: {
    req: {
      ttl: 30,
      prompt: false,
      tag: 1114,
    },
    res: {
      ttl: 30,
      prompt: false,
      tag: 1115,
    },
  },
} as const

export class CryptoClient {

  readonly events = new SuperEventTarget<{
    request: (request: RpcRequestPreinit<unknown>) => Result<unknown, Error>
    response: (response: RpcResponseInit<unknown>) => void
  }>()

  constructor(
    readonly topic: string,
    readonly key: Bytes<32>,
    readonly cipher: ChaCha20Poly1305.Cipher,
    readonly irn: IrnClient
  ) {
    irn.events.on("request", this.#onIrnRequest.bind(this))
  }

  async #onIrnRequest(request: RpcRequestPreinit<unknown>) {
    if (request.method === "irn_subscription")
      return await this.#onIrnSubscription(request)
    return new None()
  }

  async #onIrnSubscription(request: RpcRequestPreinit<unknown>) {
    const { data } = (request as RpcRequestPreinit<IrnSubscriptionPayload>).params

    if (data.topic !== this.topic)
      return new None()

    return new Some(await this.#onMessage(data.message))
  }

  async #onMessage(message: string): Promise<Result<true, Error>> {
    return Result.unthrow(async t => {
      using slice = Base64.get().tryDecodePadded(message).throw(t)

      const envelope = Readable.tryReadFromBytes(Envelope, slice.bytes).throw(t)
      const cipher = envelope.fragment.tryReadInto(Ciphertext).throw(t)
      const plain = cipher.tryDecrypt(this.cipher).throw(t)
      const plaintext = Bytes.toUtf8(plain.fragment.bytes)

      const data = SafeJson.parse(plaintext) as RpcRequestInit<unknown> | RpcResponseInit<unknown>

      if ("method" in data)
        this.#onRequest(data).then(r => r.unwrap()).catch(Errors.log)
      else
        this.#onResponse(data).then(r => r.unwrap()).catch(Errors.log)

      return new Ok(true)
    })
  }

  async #onRequest(request: RpcRequestInit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      console.log("relay request", "->", request)
      const result = await this.#tryRouteRequest(request)
      const response = RpcResponse.rewrap(request.id, result)
      console.log("relay", "<-", response)

      const { topic } = this
      const message = this.#tryEncrypt(response).throw(t)
      const { prompt, tag, ttl } = ENGINE_RPC_OPTS[request.method].res
      return await this.irn.tryPublish({ topic, message, prompt, tag, ttl })
    })
  }

  async #tryRouteRequest(request: RpcRequestPreinit<unknown>) {
    const returned = await this.events.emit("request", [request])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled`))
  }

  async #onResponse(response: RpcResponseInit<unknown>) {
    console.log("relay response", "->", response)
    const returned = await this.events.emit("response", [response])

    if (returned.isSome())
      return Ok.void()

    return new Err(new Error(`Unhandled`))
  }

  #tryEncrypt(data: unknown): Result<string, Error> {
    return Result.unthrowSync(t => {
      const plaintext = SafeJson.stringify(data)
      const plain = new Plaintext(new Opaque(Bytes.fromUtf8(plaintext)))
      const iv = Bytes.tryRandom(12).throw(t) // TODO maybe use a counter
      const cipher = plain.tryEncrypt(this.cipher, iv).throw(t)
      const envelope = new EnvelopeTypeZero(cipher)
      const bytes = Writable.tryWriteToBytes(envelope).throw(t)
      const message = Base64.get().tryEncodePadded(bytes).throw(t)

      return new Ok(message)
    })
  }

  async tryRequest<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return Result.unthrow(async t => {
      const request = SafeRpc.prepare(init)
      console.log("relay", "<-", request)

      const { topic } = this
      const message = this.#tryEncrypt(request).throw(t)
      const { prompt, tag, ttl } = ENGINE_RPC_OPTS[init.method].req

      const future = new Future<Result<RpcResponse<T>, Error>>()
      const signal = AbortSignal.timeout(ttl * 1000)

      const onResponse = (init: RpcResponseInit<any>) => {
        if (init.id !== request.id)
          return new None()
        const response = RpcResponse.from<T>(init)
        future.resolve(new Ok(response))
        return new Some(undefined)
      }

      const onAbort = () => {
        future.resolve(new Err(new Error(`Timed out`)))
      }

      try {
        this.events.on("response", onResponse, { passive: true })
        signal.addEventListener("abort", onAbort, { passive: true })

        await this.irn.tryPublish({ topic, message, prompt, tag, ttl }).then(r => r.throw(t))

        return await future.promise
      } finally {
        this.events.off("response", onResponse)
        signal.removeEventListener("abort", onAbort)
      }
    })
  }

}