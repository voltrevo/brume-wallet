import { Opaque, Writable } from "@hazae41/binary"
import { Cursor, CursorReadError } from "@hazae41/cursor"
import { Ok, Result } from "@hazae41/result"

export interface ApduResponseInit<T extends Writable.Infer<T>> {
  readonly status: number
  readonly fragment?: T
}

export class ApduResponse<T extends Writable.Infer<T>> {

  constructor(
    readonly status: number,
    readonly fragment: T
  ) { }

  static tryRead(cursor: Cursor): Result<ApduResponse<Opaque>, CursorReadError> {
    return Result.unthrowSync(t => {
      const bytes = cursor.tryRead(cursor.remaining - 2).throw(t)
      const status = cursor.tryReadUint16().throw(t)
      const fragment = new Opaque(bytes)

      return new Ok(new ApduResponse(status, fragment))
    })
  }

}