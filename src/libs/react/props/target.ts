import { Nullable } from "@hazae41/option";
import { Setter } from "../state";

export interface TargetProps<T extends Element = Element> {
  readonly target: Nullable<T>;
  readonly setTarget: Setter<Nullable<T>>
}