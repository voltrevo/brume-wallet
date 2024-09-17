export class AnyGuard {

  constructor() { }

  static asOrThrow(value: unknown): any {
    return value
  }

  asOrThrow(value: unknown): any {
    return value
  }

}

export class NeverGuard {

  constructor() { }

  static asOrThrow(value: never): never {
    throw new Error()
  }

  asOrThrow(value: never): never {
    throw new Error()
  }

}