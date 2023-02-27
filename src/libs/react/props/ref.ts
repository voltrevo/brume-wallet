import { Ref } from "react";

export interface RefProps<T = HTMLElement> {
  xref?: Ref<T>;
}