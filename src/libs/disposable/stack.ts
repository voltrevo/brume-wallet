export class Dispose {

  constructor(
    readonly dispose: () => void
  ) { }

  [Symbol.dispose]() {
    this.dispose()
  }

}

export class DisposableTuple<T extends readonly Disposable[]> {

  constructor(
    readonly inner: T
  ) { }

  [Symbol.dispose]() {
    for (const disposable of this.inner) {
      using _ = disposable
    }
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

  [Symbol.toStringTag]() {
    return "DisposableStack"
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

  adopt<T>(value: T, dispose: (value: T) => void) {
    if (this.#disposed)
      throw new Error()

    this.#stack.unshift(new Dispose(() => dispose(value)))

    return value
  }

  defer(dispose: () => void) {
    if (this.#disposed)
      throw new Error()

    this.#stack.unshift(new Dispose(dispose))
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