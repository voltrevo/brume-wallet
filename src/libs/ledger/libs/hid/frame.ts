import { Opaque, Readable, Writable } from "@hazae41/binary"
import { Cursor, CursorReadError, CursorWriteError } from "@hazae41/cursor"
import { Err, Ok, Result } from "@hazae41/result"

export class InvalidTagError extends Error {
  readonly #class = InvalidTagError
  readonly name = this.#class.name

  constructor(
    readonly tag: number
  ) {
    super(`Invalid tag ${tag}`)
  }

}

export class HIDFrame<T extends Writable.Infer<T>> {
  readonly #class = HIDFrame

  static readonly tag = 0x05 as const

  constructor(
    readonly channel: number,
    readonly fragment: T,
    readonly index: number,
  ) { }

  trySize(): Result<number, Writable.SizeError<T>> {
    return this.fragment.trySize().mapSync(x => 5 + x)
  }

  tryWrite(cursor: Cursor): Result<void, CursorWriteError | Writable.WriteError<T>> {
    return Result.unthrowSync(t => {
      cursor.tryWriteUint16(this.channel).throw(t)
      cursor.tryWriteUint8(this.#class.tag).throw(t)
      cursor.tryWriteUint16(this.index).throw(t)
      this.fragment.tryWrite(cursor).throw(t)

      return Ok.void()
    })
  }

  static tryRead(cursor: Cursor): Result<HIDFrame<Opaque>, CursorReadError | InvalidTagError> {
    return Result.unthrowSync(t => {
      const channel = cursor.tryReadUint16().throw(t)
      const tag = cursor.tryReadUint8().throw(t)

      if (tag !== this.tag)
        return new Err(new InvalidTagError(tag))

      const index = cursor.tryReadUint16().throw(t)
      const bytes = cursor.tryRead(cursor.remaining).throw(t)
      const fragment = new Opaque(bytes)

      return new Ok(new HIDFrame(channel, fragment, index))
    })
  }

  static *trySplit<T extends Writable.Infer<T>>(channel: number, bytes: Uint8Array) {
    const chunks = new Cursor(bytes).trySplit(59)

    let chunk = chunks.next()

    for (let i = 0; !chunk.done; chunk = chunks.next(), i++)
      yield new HIDFrame(channel, new Opaque(chunk.value), i)

    return chunk.value
  }

  static async tryUnsplit(channel: number, generator: AsyncGenerator<HIDFrame<Opaque>, Err<Error>, unknown>) {
    const first = await generator.next()

    if (first.done)
      return first.value

    const frames = Readable.tryReadFromBytes(HIDContainer, first.value.fragment.bytes)

    if (frames.isErr())
      return frames

    const cursor = Cursor.tryAllocUnsafe(frames.inner.length)

    if (cursor.isErr())
      return cursor

    const write = cursor.inner.tryWrite(frames.inner.fragment.bytes.slice(0, cursor.inner.remaining))

    if (write.isErr())
      return write
    if (!cursor.inner.remaining)
      return new Ok(cursor.inner.bytes)

    let frame = await generator.next()

    for (; !frame.done; frame = await generator.next()) {
      const write = cursor.inner.tryWrite(frame.value.fragment.bytes.slice(0, cursor.inner.remaining))

      if (write.isErr())
        return write
      if (!cursor.inner.remaining)
        return new Ok(cursor.inner.bytes)
      continue
    }

    return frame.value
  }

}

export class HIDContainer<T extends Writable.Infer<T>> {

  constructor(
    readonly length: number,
    readonly fragment: T,
  ) { }

  static tryNew<T extends Writable.Infer<T>>(fragment: T): Result<HIDContainer<T>, Writable.SizeError<T>> {
    return Result.unthrowSync(t => {
      const length = fragment.trySize().throw(t)
      const container = new HIDContainer(length, fragment)

      return new Ok(container)
    })
  }

  trySize(): Result<number, Writable.SizeError<T>> {
    return new Ok(Math.ceil((2 + this.length) / 59) * 59)
  }

  tryWrite(cursor: Cursor): Result<void, CursorWriteError | Writable.WriteError<T>> {
    return Result.unthrowSync(t => {
      cursor.tryWriteUint16(this.length).throw(t)
      this.fragment.tryWrite(cursor).throw(t)
      cursor.fill(0, cursor.remaining)

      return Ok.void()
    })
  }

  static tryRead(cursor: Cursor): Result<HIDContainer<Opaque>, CursorReadError> {
    return Result.unthrowSync(t => {
      const length = cursor.tryReadUint16().throw(t)
      const bytes = cursor.tryRead(cursor.remaining).throw(t)
      const fragment = new Opaque(bytes)

      return new Ok(new HIDContainer(length, fragment))
    })
  }
}