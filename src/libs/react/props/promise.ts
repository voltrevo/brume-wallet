export type PromiseProps<T, E> =
  & OkProps<T>
  & ErrProps<E>

export interface OptionalOkProps<T> {
  readonly ok?: (value: T) => void
}

export interface OkProps<T> {
  readonly ok: (value: T) => void
}

export interface ErrProps<T> {
  readonly err: (error: T) => void
}