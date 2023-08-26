import { Result } from "@hazae41/result";
import { Errors } from "../errors/errors";

export namespace Results {

  export function logAndAlert<T extends Result<unknown, Error>>(result: T): T {
    result.inspectErrSync(Errors.logAndAlert)
    return result
  }

}