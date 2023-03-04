export interface OkInit<T = unknown> {
  readonly data: T
  readonly error?: undefined
}

export class Ok<T = unknown> {

  constructor(
    readonly data: T
  ) { }

  static from<T>(init: OkInit<T>) {
    const { data } = init
    return new this(data)
  }

  unwrap() {
    return this.data
  }

}