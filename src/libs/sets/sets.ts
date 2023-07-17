export namespace Sets {

  /**
   * Set of elements in A or in B
   * @param a 
   * @param b 
   * @returns 
   */
  export function union<T>(a: Set<T>, b: Set<T>) {
    return new Set([...a, ...b])
  }

  /**
   * Set of elements in A and in B
   * @param a 
   * @param b 
   * @returns 
   */
  export function inter<T>(a: Set<T>, b: Set<T>) {
    return new Set([...a].filter(x => b.has(x)))
  }

  /**
   * Set of elements in A but not in B
   * @param a 
   * @param b 
   * @returns 
   */
  export function minus<T>(a: Set<T>, b: Set<T>) {
    return new Set([...a].filter(x => !b.has(x)))
  }

}