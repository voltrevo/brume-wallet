export type PromiseProps<T, E> =
  & OkProps<T>
  & ErrProps<E>

export interface OptionalOkProps<T> {
  ok?(value: T): void
}

export interface OkProps<T> {
  ok(value: T): void
}

export interface ErrProps<T> {
  err(error: T): void
}