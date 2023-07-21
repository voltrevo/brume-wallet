import { createQuerySchema } from "@hazae41/xswr";
import { AppRequest } from "../data";

export namespace AppRequests {

  export function get() {
    return createQuerySchema<string, AppRequest[], never>({ key: `requests` })
  }

}