export type Promiseable<T> = T | Promise<T>

export namespace Promises {

  /**
   * Forcefully run something in the background
   * @returns 
   */
  export function fork() {
    return new Promise(ok => setTimeout(ok, 0))
  }
}