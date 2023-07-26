import { BinaryWriteError } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";
import { Ok, Result } from "@hazae41/result";

export class Paths {

  constructor(
    readonly paths: number[]
  ) { }

  static from(path: string) {
    const paths = new Array<number>()

    for (const subpath of path.split("/")) {
      const value = subpath.endsWith("'")
        ? parseInt(subpath, 10) + 0x80_00_00_00
        : parseInt(subpath, 10)
      paths.push(value)
    }

    return new Paths(paths)
  }

  trySize(): Result<number, never> {
    return new Ok(1 + (this.paths.length * 4))
  }

  tryWrite(cursor: Cursor): Result<void, BinaryWriteError> {
    return Result.unthrowSync(t => {
      cursor.tryWriteUint8(this.paths.length).throw(t)

      for (const path of this.paths)
        cursor.tryWriteUint32(path).throw(t)

      return Ok.void()
    })
  }
}