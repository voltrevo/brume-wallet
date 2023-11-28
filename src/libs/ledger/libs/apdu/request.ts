import { Writable } from "@hazae41/binary"
import { Cursor } from "@hazae41/cursor"

export class ApduDataOverflowError extends Error {
  readonly #class = ApduDataOverflowError
  readonly name = this.#class.name

  constructor(
    readonly length: number
  ) {
    super(`Data overflow (${length} > 255)`)
  }
}

export interface ApduRequestInit<T extends Writable> {
  readonly cla: number
  readonly ins: number
  readonly p1: number
  readonly p2: number
  readonly fragment: T
}

export class ApduRequest<T extends Writable> {

  constructor(
    readonly cla: number,
    readonly ins: number,
    readonly p1: number,
    readonly p2: number,
    readonly fragment: T,
    readonly fragmentSize: number
  ) { }

  static fromOrThrow<T extends Writable>(init: ApduRequestInit<T>): ApduRequest<T> {
    const { cla, ins, p1, p2, fragment } = init

    const fragmentSize = fragment.sizeOrThrow()

    if (fragmentSize > 255)
      throw new ApduDataOverflowError(fragmentSize)

    return new ApduRequest(cla, ins, p1, p2, fragment, fragmentSize)
  }

  sizeOrThrow() {
    return 1 + 1 + 1 + 1 + 1 + this.fragmentSize
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeUint8OrThrow(this.cla)
    cursor.writeUint8OrThrow(this.ins)
    cursor.writeUint8OrThrow(this.p1)
    cursor.writeUint8OrThrow(this.p2)
    cursor.writeUint8OrThrow(this.fragmentSize)
    this.fragment.writeOrThrow(cursor)
  }

}