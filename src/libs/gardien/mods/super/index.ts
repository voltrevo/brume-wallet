/**
 * Accept a value of supertype of `T` 
 */
export type Super<X, T> = T extends X ? X : never

/**
 * Force literal type `X` to be inferred
 */
export type Resolve<T> = T extends Super<T, T> ? T : never