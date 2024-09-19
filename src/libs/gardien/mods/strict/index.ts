/**
 * Accept a value of exact type `T` 
 */
export type Strict<X, T> = T extends X ? T : never