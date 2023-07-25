import { Writable } from "@hazae41/binary"
import { Cursor, CursorWriteError } from "@hazae41/cursor"
import { Err, Ok, Result } from "@hazae41/result"
import { ApduDataOverflowError } from "../../mods/usb"

export interface ApduRequestInit<T extends Writable.Infer<T>> {
  readonly cla: number
  readonly ins: number
  readonly p1: number
  readonly p2: number
  readonly fragment: T
}

export class ApduRequest<T extends Writable.Infer<T>> {

  constructor(
    readonly cla: number,
    readonly ins: number,
    readonly p1: number,
    readonly p2: number,
    readonly fragment: T,
    readonly fragmentSize: number
  ) { }

  static tryFrom<T extends Writable.Infer<T>>(init: ApduRequestInit<T>): Result<ApduRequest<T>, ApduDataOverflowError | Writable.SizeError<T>> {
    return Result.unthrowSync(t => {
      const { cla, ins, p1, p2, fragment } = init

      const fragmentSize = fragment.trySize().throw(t)

      if (fragmentSize > 255)
        return new Err(new ApduDataOverflowError(fragmentSize))

      return new Ok(new ApduRequest(cla, ins, p1, p2, fragment, fragmentSize))
    })
  }

  trySize(): Result<number, never> {
    return new Ok(1 + 1 + 1 + 1 + 1 + this.fragmentSize)
  }

  tryWrite(cursor: Cursor): Result<void, CursorWriteError | Writable.WriteError<T>> {
    return Result.unthrowSync(t => {
      cursor.tryWriteUint8(this.cla).throw(t)
      cursor.tryWriteUint8(this.ins).throw(t)
      cursor.tryWriteUint8(this.p1).throw(t)
      cursor.tryWriteUint8(this.p2).throw(t)
      cursor.tryWriteUint8(this.fragmentSize).throw(t)
      this.fragment.tryWrite(cursor).throw(t)

      return Ok.void()
    })
  }

}