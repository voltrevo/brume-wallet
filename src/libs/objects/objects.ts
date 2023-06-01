import { Promiseable } from "../promises/promises"

export namespace Objects {

  export function fromEntries<K extends keyof any, T>(entries: [K, T][]) {
    return Object.fromEntries(entries) as Record<K, T>
  }

  export function entries<K extends keyof any, T>(object: Record<K, T>) {
    return Object.entries(object) as [K, T][]
  }

  export function values<K extends keyof any, T>(object: Record<K, T>) {
    return Object.values(object) as T[]
  }

  export async function mapValues<K extends keyof any, I, O>(object: Record<K, I>, mapper: (v: I) => Promiseable<O>) {
    return fromEntries(await Promise.all(entries(object).map(async ([k, v]) => [k, await mapper(v)])))
  }

  export function mapValuesSync<K extends keyof any, I, O>(object: Record<K, I>, mapper: (v: I) => O) {
    return fromEntries(entries(object).map(([k, v]) => [k, mapper(v)]))
  }

}