/**
 * Accept a value of supertype of `T` 
 */
export type Super<A, B> = B extends A ? A : never

/**
 * Force literal type to be inferred
 */
export type Resolve<T> = T extends Super<T, T> ? T : never

/**
 * Override type `X` with type `S`
 */
export type Override<X, S> = Omit<X, keyof S> & S

/**
 * Gross override
 */
export type Groverride<A, B> =
  A extends readonly any[] ?
  B extends readonly (infer V)[] ?
  { [K in keyof A]: V }
  : Override<A, B>
  : Override<A, B>