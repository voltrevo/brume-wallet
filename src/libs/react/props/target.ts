import { ElementHandle } from "../handles/element";

export interface TargetProps<T extends Element = Element> {
  readonly target: ElementHandle<T>;
}
