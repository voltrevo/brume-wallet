import { RpcId, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc";
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
import { IrnBrume, IrnSubscriptionPayload } from "../irn/irn";
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

export interface RpcRequestReceipt {
  readonly id: RpcId

  /**
   * Absolute ttl in milliseconds
   * = (Date.now() + (ttl * 1000))
   */
  readonly end: number
}

export class CryptoClient {

  readonly events = new SuperEventTarget<{
    request: (request: RpcRequestPreinit<unknown>) => Result<unknown, Error>
    response: (response: RpcResponseInit<unknown>) => void
  }>()

  #ack = new Set<number>()

  private constructor(
    readonly topic: string,
    readonly key: Bytes<32>,
    readonly irn: IrnBrume,
    readonly cipher: ChaCha20Poly1305.Cipher
  ) {
    irn.events.on("request", this.#onIrnRequest.bind(this))
  }

  static tryNew(topic: string, key: Bytes<32>, irn: IrnBrume): Result<CryptoClient, Error> {
    return Result.unthrowSync(t => {
      const cipher = ChaCha20Poly1305.get().Cipher.tryImport(key).throw(t)
      const client = new CryptoClient(topic, key, irn, cipher)

      return new Ok(client)
    })
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
        await this.#onRequest(data).then(r => r.throw(t))
      else
        await this.#onResponse(data).then(r => r.throw(t))

      return new Ok(true)
    })
  }

  async #onRequest(request: RpcRequestInit<unknown>): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      if (typeof request.id !== "number")
        return Ok.void()
      if (this.#ack.has(request.id))
        return Ok.void()
      this.#ack.add(request.id)

      console.log("relay request", "->", request)
      const result = await this.#tryRouteRequest(request)
      const response = RpcResponse.rewrap(request.id, result)
      console.log("relay", "<-", response)

      const { topic } = this
      const message = this.#tryEncrypt(response).throw(t)
      const { prompt, tag, ttl } = ENGINE_RPC_OPTS[request.method].res
      await this.irn.tryPublish({ topic, message, prompt, tag, ttl }).then(r => r.throw(t))

      return Ok.void()
    })
  }

  async #tryRouteRequest(request: RpcRequestPreinit<unknown>) {
    const returned = await this.events.emit("request", [request])

    if (returned.isSome())
      return returned.inner

    console.log("unhandled crypto client")
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

  async tryRequestAndWait<T>(init: RpcRequestPreinit<unknown>): Promise<Result<RpcResponse<T>, Error>> {
    return await Result.unthrow(async t => {
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

  async tryRequest(init: RpcRequestPreinit<unknown>): Promise<Result<RpcRequestReceipt, Error>> {
    return Result.unthrow(async t => {
      const request = SafeRpc.prepare(init)
      console.log("relay", "<-", request)

      const { topic } = this
      const message = this.#tryEncrypt(request).throw(t)
      const { prompt, tag, ttl } = ENGINE_RPC_OPTS[init.method].req

      const { id } = request
      const end = Date.now() + (ttl * 1000)

      await this.irn.tryPublish({ topic, message, prompt, tag, ttl }).then(r => r.throw(t))

      return new Ok({ id, end })
    })
  }

  async tryWait<T>(receipt: RpcRequestReceipt): Promise<Result<RpcResponse<T>, Error>> {
    const future = new Future<Result<RpcResponse<T>, Error>>()
    const signal = AbortSignal.timeout(receipt.end - Date.now())

    const onResponse = (init: RpcResponseInit<any>) => {
      if (init.id !== receipt.id)
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

      return await future.promise
    } finally {
      this.events.off("response", onResponse)
      signal.removeEventListener("abort", onAbort)
    }
  }

}