import { Setter } from "../state";

export type StateProps<K1 extends string, K2 extends string, T> =
  & { readonly [x in K1]: T }
  & { readonly [x in K2]: Setter<T> }