import { Opaque, Readable, Writable } from "@hazae41/binary"
import { Cursor } from "@hazae41/cursor"

export class InvalidTagError extends Error {
  readonly #class = InvalidTagError
  readonly name = this.#class.name

  constructor(
    readonly tag: number
  ) {
    super(`Invalid tag ${tag}`)
  }

}

export class HIDFrame<T extends Writable> {
  readonly #class = HIDFrame

  static readonly tag = 0x05 as const

  constructor(
    readonly channel: number,
    readonly fragment: T,
    readonly index: number,
  ) { }

  sizeOrThrow() {
    return 2 + 1 + 2 + this.fragment.sizeOrThrow()
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeUint16OrThrow(this.channel)
    cursor.writeUint8OrThrow(this.#class.tag)
    cursor.writeUint16OrThrow(this.index)
    this.fragment.writeOrThrow(cursor)
  }

  static readOrThrow(cursor: Cursor): HIDFrame<Opaque> {
    const channel = cursor.readUint16OrThrow()
    const tag = cursor.readUint8OrThrow()

    if (tag !== this.tag)
      throw new InvalidTagError(tag)

    const index = cursor.readUint16OrThrow()
    const bytes = cursor.readAndCopyOrThrow(cursor.remaining)
    const fragment = new Opaque(bytes)

    return new HIDFrame(channel, fragment, index)
  }

  static *splitOrThrow(channel: number, bytes: Uint8Array) {
    const chunks = new Cursor(bytes).splitOrThrow(59)

    let chunk = chunks.next()

    for (let i = 0; !chunk.done; chunk = chunks.next(), i++)
      yield new HIDFrame(channel, new Opaque(chunk.value), i)

    return chunk.value
  }

  static async unsplitOrThrow(channel: number, generator: AsyncGenerator<HIDFrame<Opaque>, never, unknown>) {
    const first = await generator.next()

    if (first.done)
      return first.value

    const frames = Readable.readFromBytesOrThrow(HIDContainer, first.value.fragment.bytes)

    const bytes = new Uint8Array(frames.length)
    const cursor = new Cursor(bytes)

    cursor.writeOrThrow(frames.fragment.bytes.slice(0, cursor.remaining))

    if (!cursor.remaining)
      return cursor.bytes

    let frame = await generator.next()

    for (; !frame.done; frame = await generator.next()) {
      cursor.writeOrThrow(frame.value.fragment.bytes.slice(0, cursor.remaining))

      if (!cursor.remaining)
        return cursor.bytes

      continue
    }

    return frame.value
  }

}

export class HIDContainer<T extends Writable> {

  constructor(
    readonly length: number,
    readonly fragment: T,
  ) { }

  static newOrThrow<T extends Writable>(fragment: T): HIDContainer<T> {
    return new HIDContainer(fragment.sizeOrThrow(), fragment)
  }

  sizeOrThrow() {
    return Math.ceil((2 + this.length) / 59) * 59
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeUint16OrThrow(this.length)
    this.fragment.writeOrThrow(cursor)
    cursor.fillOrThrow(0, cursor.remaining)
  }

  static readOrThrow(cursor: Cursor): HIDContainer<Opaque> {
    const length = cursor.readUint16OrThrow()
    const bytes = cursor.readAndCopyOrThrow(cursor.remaining)
    const fragment = new Opaque(bytes)

    return new HIDContainer(length, fragment)
  }
}