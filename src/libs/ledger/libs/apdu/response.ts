import { Opaque, Writable } from "@hazae41/binary"
import { Cursor } from "@hazae41/cursor"
import { Err, Ok } from "@hazae41/result"

export interface ApduResponseInit<T extends Writable> {
  readonly status: number
  readonly fragment?: T
}

export type ApduResponse<T extends Writable> =
  | ApduOk<T>
  | ApduErr<T>

export namespace ApduResponse {

  export function readOrThrow(cursor: Cursor) {
    const bytes = cursor.readAndCopyOrThrow(cursor.remaining - 2)
    const status = cursor.readUint16OrThrow()
    const fragment = new Opaque(bytes)

    if (status === ApduOk.status)
      return new ApduOk(fragment)

    return new ApduErr(status, fragment)
  }

}

export class ApduError<T extends Writable> extends Error {
  readonly #class = ApduError
  readonly name = this.#class.name

  constructor(
    readonly status: number,
    readonly fragment: T
  ) {
    super(`${status}`)
  }

}

export class ApduOk<T extends Writable> extends Ok<T> {
  readonly #class = ApduOk

  static readonly status = 0x9000 as const

  constructor(
    readonly fragment: T
  ) {
    super(fragment)
  }

  get status() {
    return this.#class.status
  }

}

export class ApduErr<T extends Writable> extends Err<ApduError<T>> {

  constructor(
    readonly status: number,
    readonly fragment: T
  ) {
    super(new ApduError(status, fragment))
  }

}
