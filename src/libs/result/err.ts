export interface ErrInit {
  readonly error: unknown
}

export class Err {

  constructor(
    readonly error: unknown
  ) { }

  static from(init: ErrInit) {
    const { error } = init
    return new this(error)
  }

  unwrap(): never {
    throw this.error
  }

}