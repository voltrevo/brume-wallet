import { Optional } from "@hazae41/option"

export type ElementProps<Key extends string = "element"> = {
  [x in Key]: HTMLElement;
}

export type OptionalElementProps<Key extends string = "element"> = {
  [x in Key]?: Optional<HTMLElement>;
}