import { Result } from "@hazae41/result";
import { Errors } from "../errors/errors";

export namespace Results {

  export function alert<T extends Result<unknown, Error>>(result: T): T {
    result.inspectErrSync(e => globalThis.alert(Errors.toString(e)))
    return result
  }

}