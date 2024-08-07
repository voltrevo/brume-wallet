import { Nullable, Optional } from "@hazae41/option";

/**
 * Nullable to optional
 * @param value 
 * @returns 
 */
export function nto<T>(value: Nullable<T>): Optional<T> {
  if (value != null) return value
}