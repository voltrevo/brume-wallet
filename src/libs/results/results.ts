import { Result } from "@hazae41/result";
import { Errors } from "../errors/errors";

export namespace Results {

  export function log<T extends Result<unknown, unknown>>(result: T): T {
    result.inspectErrSync(Errors.log)
    return result
  }

  export function logAndAlert<T extends Result<unknown, unknown>>(result: T): T {
    result.inspectErrSync(Errors.logAndAlert)
    return result
  }

}