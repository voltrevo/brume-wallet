import { createQuerySchema } from "@hazae41/glacier";
import { AppRequest } from "../data";

export namespace AppRequests {

  export type Key = typeof key

  export const key = `requests`

  export type Schema = ReturnType<typeof schema>

  export function schema() {
    return createQuerySchema<Key, AppRequest[], never>({ key })
  }

}