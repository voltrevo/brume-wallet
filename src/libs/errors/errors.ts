export namespace Errors {

  export function toJSON(error: unknown): unknown {
    if (error instanceof Error)
      return { name: error.name, message: error.message, cause: toJSON(error.cause) }
    return error
  }

  export function toString(error: unknown) {
    return JSON.stringify(toJSON(error))
  }

  export function log(error: unknown) {
    console.error(toString(error))
  }

  export function logAndAlert(error: unknown) {
    console.error(toString(error))
    alert(toString(error))
  }

}