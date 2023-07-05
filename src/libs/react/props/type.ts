export type TypeProps<Key extends string = "type"> = {
  [key in Key]: string
}

export type PartialTypeProps<Key extends string = "type"> = {
  [key in Key]?: string
}