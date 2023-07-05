import { Optional } from "@hazae41/option"

export type TypeProps<Key extends string = "type"> = {
  [key in Key]: string
}

export type OptionalTypeProps<Key extends string = "type"> = {
  [key in Key]?: Optional<string>
}