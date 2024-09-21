/**
 * Accept a value of supertype of `T` 
 */
export type Super<X, T> = T extends X ? X : never

/**
 * Force literal type `X` to be inferred
 */
export type Resolve<T> = T extends Super<T, T> ? T : never

/**
 * Get the strongest type of `X` and `T`
 */
export type Strongest<X, T> = T extends readonly (infer U)[] ? { [K in keyof X]: U } : T