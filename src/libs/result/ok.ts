export interface OkInit<T> {
  readonly data: T
}

export class Ok<T> {

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