export class UserRejectionError extends Error {
  readonly #class = UserRejectionError
  readonly name = this.#class.name

  constructor() {
    super(`User rejected the request`)
  }

  static new() {
    return new UserRejectionError()
  }

}