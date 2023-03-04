export interface ErrInit {
  readonly data?: undefined
  readonly error: {}
}

export class Err {

  constructor(
    readonly error: {}
  ) { }

  static from(init: ErrInit) {
    const { error } = init
    return new this(error)
  }

  unwrap(): never {
    throw this.error
  }

}