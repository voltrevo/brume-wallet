/**
 * Accept a value of exact type `I` or accept a value of type `O`
 */
export type Coerced<X, I, O> = I extends X ? I : O

export namespace Coerced {

  export type Input<F, X, I, O> = F extends <X>(value: Coerced<X, I, O>) => X & O ? Coerced<X, I, O> : I;

  export type Output<F, X, I, O> = F extends <X>(value: Coerced<X, I, O>) => X & O ? X & O : O;

}