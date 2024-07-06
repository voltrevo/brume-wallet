class Cleanup {

  constructor(
    readonly cleanup: () => void
  ) { }

  [Symbol.dispose]() {
    this.cleanup()
  }

}

export class DisposableStack {

  #stack = new Array<Disposable>()

  #disposed = false

  constructor() { }

  get disposed() {
    return this.#disposed
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  dispose() {
    if (this.#disposed)
      return

    this.#disposed = true

    for (const disposable of this.#stack) {
      using _ = disposable
    }

    return
  }

  use<T extends Disposable>(disposable: T) {
    if (this.#disposed)
      throw new Error()

    this.#stack.unshift(disposable)

    return disposable
  }

  adopt<T>(value: T, callback: (value: T) => void) {
    if (this.#disposed)
      throw new Error()

    this.#stack.unshift(new Cleanup(() => callback(value)))

    return value
  }

  defer(callback: () => void) {
    if (this.#disposed)
      throw new Error()

    this.#stack.unshift(new Cleanup(callback))
  }

  move() {
    if (this.#disposed)
      throw new Error()

    const next = new DisposableStack()

    for (const disposable of this.#stack) {
      next.use(disposable)
    }

    this.#stack = new Array()
    this.#disposed = true

    return next
  }

}