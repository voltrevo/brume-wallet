import { JSX } from "react";

export interface FallbackProps<P> {
  fallback(props: P): JSX.Element
}