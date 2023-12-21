import { Nullable } from "@hazae41/option"

export type ElementProps<Key extends string = "element"> = {
  readonly [x in Key]: HTMLElement;
}

export type NullableElementProps<Key extends string = "element"> = {
  readonly [x in Key]?: Nullable<HTMLElement>
}