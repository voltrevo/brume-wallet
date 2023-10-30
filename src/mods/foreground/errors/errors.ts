import { RpcError } from "@hazae41/jsonrpc"

export class UserRejectedError extends RpcError {
  readonly #class = UserRejectedError
  readonly name = this.#class.name

  constructor() {
    super(4001, `The user rejected the request.`)
  }

  static new() {
    return new UserRejectedError()
  }

}

export class UnauthorizedError extends RpcError {
  readonly #class = UnauthorizedError
  readonly name = this.#class.name

  constructor() {
    super(4100, `The requested method and/or account has not been authorized by the user.`)
  }

  static new() {
    return new UnauthorizedError()
  }

}

export class UnsupportedMethodError extends RpcError {
  readonly #class = UnsupportedMethodError
  readonly name = this.#class.name

  constructor() {
    super(4200, `The Provider does not support the requested method.`)
  }

  static new() {
    return new UnsupportedMethodError()
  }

}

export class DisconnectedError extends RpcError {
  readonly #class = DisconnectedError
  readonly name = this.#class.name

  constructor() {
    super(4900, `The Provider is disconnected from all chains.`)
  }

  static new() {
    return new DisconnectedError()
  }

}

export class ChainDisconnectedError extends RpcError {
  readonly #class = ChainDisconnectedError
  readonly name = this.#class.name

  constructor() {
    super(4901, `The Provider is not connected to the requested chain.`)
  }

  static new() {
    return new ChainDisconnectedError()
  }

}