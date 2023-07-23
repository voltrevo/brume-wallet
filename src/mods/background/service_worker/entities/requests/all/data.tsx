import { createQuerySchema } from "@hazae41/xswr";
import { AppRequest } from "../data";

export namespace AppRequests {

  export function query() {
    return createQuerySchema<string, AppRequest[], never>({ key: `requests` })
  }

}