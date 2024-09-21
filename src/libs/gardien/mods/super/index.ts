/**
 * Accept a value of supertype of `T` 
 */
export type Super<A, B> = B extends A ? A : never

/**
 * Force literal type to be inferred
 */
export type Resolve<T> = T extends Super<T, T> ? T : never

export type Intersect<A, B> =
  A extends readonly (infer U)[] ?
  B extends readonly (infer V)[] ?
  { [K in keyof A]: V }
  : A & B
  : A & B