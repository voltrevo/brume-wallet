/**
 * Accept a value of supertype of `T` 
 */
export type Super<X, T> = T extends X ? X : never