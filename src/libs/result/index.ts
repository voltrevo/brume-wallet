import { Err } from "./err";
import { Ok } from "./ok";

export * from "./err";
export * from "./ok";
export * as Result from "./result";

export type Result<T = unknown> =
  | Ok<T>
  | Err