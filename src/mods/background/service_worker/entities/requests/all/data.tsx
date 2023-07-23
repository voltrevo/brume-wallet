import { createQuerySchema } from "@hazae41/xswr";
import { AppRequest } from "../data";

export namespace AppRequests {

  export type Schema = ReturnType<typeof schema>

  export function schema() {
    return createQuerySchema<string, AppRequest[], never>({ key: `requests` })
  }

}