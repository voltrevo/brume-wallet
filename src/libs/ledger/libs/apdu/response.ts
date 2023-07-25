import { Opaque, Writable } from "@hazae41/binary"
import { Cursor, CursorReadError } from "@hazae41/cursor"
import { Err, Ok, Result } from "@hazae41/result"

export interface ApduResponseInit<T extends Writable.Infer<T>> {
  readonly status: number
  readonly fragment?: T
}

export type ApduResponse<T extends Writable.Infer<T>> =
  | ApduOk<T>
  | ApduErr<T>

export namespace ApduResponse {

  export function tryRead(cursor: Cursor): Result<ApduResponse<Opaque>, CursorReadError> {
    return Result.unthrowSync(t => {
      const bytes = cursor.tryRead(cursor.remaining - 2).throw(t)
      const status = cursor.tryReadUint16().throw(t)
      const fragment = new Opaque(bytes)

      if (status === ApduOk.status)
        return new Ok(new ApduOk(fragment))
      return new Ok(new ApduErr(status, fragment))
    })
  }

}

export class ApduError<T extends Writable.Infer<T>> extends Error {
  readonly #class = ApduError
  readonly name = this.#class.name

  constructor(
    readonly status: number,
    readonly fragment: T
  ) {
    super(`${status}`)
  }

}

export class ApduOk<T extends Writable.Infer<T>> extends Ok<T> {
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

export class ApduErr<T extends Writable.Infer<T>> extends Err<ApduError<T>> {
  constructor(
    readonly status: number,
    readonly fragment: T
  ) {
    super(new ApduError(status, fragment))
  }
}
