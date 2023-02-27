import { ElementHandle } from "../handles/element";

export interface TargetProps<T extends Element = Element> {
  target: ElementHandle<T>;
}
