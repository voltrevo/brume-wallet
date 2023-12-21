import { Ref } from "react";

export interface RefProps<T = HTMLElement> {
  readonly xref?: Ref<T>;
}