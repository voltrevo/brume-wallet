import { Opaque, Writable } from "@hazae41/binary"
import { SuperReadableStream, SuperWritableStream } from "@hazae41/cascade"
import { None } from "@hazae41/option"
import { SuperEventTarget } from "@hazae41/plume"

export type SuperWebSocketEvents = {
  open: (e: Event) => void
  close: (e: CloseEvent) => void
  error: (e: Event) => void
  message: (e: MessageEvent) => void
}

export interface WebSocketProxy {
  readonly events: SuperEventTarget<SuperWebSocketEvents>

  send(data: ArrayBuffer): void
  close(): void
}

export type WebSocketStreamParams =
  & WebSocketSourceParams
  & WebSocketSinkParams

export class WebSocketStream {
  readonly reader: SuperReadableStream<Opaque>
  readonly writer: SuperWritableStream<Writable>

  readonly outer: ReadableWritablePair<Opaque, Writable>

  /**
   * A WebSocket stream
   * @description https://streams.spec.whatwg.org/#example-both
   */
  constructor(
    readonly socket: WebSocketProxy,
    readonly params: WebSocketStreamParams = {}
  ) {
    this.reader = new SuperReadableStream(new WebSocketSource(socket, params))
    this.writer = new SuperWritableStream(new WebSocketSink(socket, params))

    this.outer = {
      readable: this.reader.start(),
      writable: this.writer.start()
    }
  }

}

export interface WebSocketSourceParams {
  /**
   * Whether the socket should be closed when the stream is cancelled
   * @description You don't want to reuse the socket
   */
  readonly shouldCloseOnCancel?: boolean
}

export class WebSocketSource implements UnderlyingDefaultSource<Opaque> {

  #onClean?: () => void

  constructor(
    readonly websocket: WebSocketProxy,
    readonly params: WebSocketSourceParams = {}
  ) { }

  async start(controller: ReadableStreamDefaultController<Opaque>) {

    const onMessage = async (msgEvent: MessageEvent<ArrayBuffer>) => {
      const bytes = new Uint8Array(msgEvent.data)
      // console.debug("ws <-", bytes, Bytes.toUtf8(bytes))

      try { controller.enqueue(new Opaque(bytes)) } catch { }

      return new None()
    }

    const onError = (event: Event) => {
      const error = new Error(`Errored`, { cause: event })

      try { controller.error(error) } catch { }

      this.#onClean?.()
      return new None()
    }

    const onClose = (event: CloseEvent) => {
      try { controller.close() } catch { }

      this.#onClean?.()
      return new None()
    }

    this.websocket.events.on("message", onMessage)
    this.websocket.events.on("error", onError)
    this.websocket.events.on("close", onClose)

    this.#onClean = () => {
      this.#onClean = undefined

      this.websocket.events.off("message", onMessage)
      this.websocket.events.off("error", onError)
      this.websocket.events.off("close", onClose)
    }
  }

  async cancel() {
    if (this.params.shouldCloseOnCancel)
      try { this.websocket.close() } catch { }
    this.#onClean?.()
  }

}

export interface WebSocketSinkParams {
  /**
   * Whether the socket should be closed when the stream is closed
   * @description You don't want to reuse the socket
   * @description You're not using request-response
   */
  readonly shouldCloseOnClose?: boolean

  /**
   * Whether the socket should be closed when the stream is aborted
   * @description You don't want to reuse the socket
   */
  readonly shouldCloseOnAbort?: boolean
}

export class WebSocketSink implements UnderlyingSink<Writable> {

  #onClean?: () => void

  constructor(
    readonly websocket: WebSocketProxy,
    readonly params: WebSocketSinkParams = {}
  ) { }

  async start(controller: WritableStreamDefaultController) {

    const onClose = (closeEvent: CloseEvent) => {
      const error = new Error(`Closed`, { cause: closeEvent })

      try { controller.error(error) } catch { }

      this.#onClean?.()
      return new None()
    }

    const onError = (event: Event) => {
      const error = new Error(`Errored`, { cause: event })

      try { controller.error(error) } catch { }

      this.#onClean?.()
      return new None()
    }

    this.websocket.events.on("close", onClose)
    this.websocket.events.on("error", onError)

    this.#onClean = () => {
      this.#onClean = undefined

      this.websocket.events.off("close", onClose)
      this.websocket.events.off("error", onError)
    }
  }

  async write(chunk: Writable) {
    const bytes = Writable.writeToBytesOrThrow(chunk)
    // console.debug("ws ->", bytes, Bytes.toUtf8(bytes))
    try { this.websocket.send(bytes) } catch { }
  }

  async abort(reason?: unknown) {
    if (this.params.shouldCloseOnAbort)
      try { this.websocket.close() } catch { }
    this.#onClean?.()
  }

  async close() {
    if (this.params.shouldCloseOnClose)
      try { this.websocket.close() } catch { }
    this.#onClean?.()
  }

}