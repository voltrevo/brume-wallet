/**
 * Accept a value of supertype of `T` 
 */
export type Super<X, T> = T extends X ? X : never

/**
 * Force literal type `X` to be inferred
 */
export type Resolve<T> = T extends Super<T, T> ? T : never

/**
 * Morph structure of `X` as `T`
 * @example Morph<[1, 2, 3], unknown[]> = [unknown, unknown, unknown]
 */
export type Morph<X, T> =
  X extends readonly unknown[] ?
  T extends readonly (infer U)[] ?
  { [K in keyof X]: U }
  : T
  : T