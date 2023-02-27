export type PromiseProps<T> =
  & OkProps<T>
  & ErrProps

export interface OkProps<T> {
  ok(value: T): void
}

export interface ErrProps {
  err(error: unknown): void
}