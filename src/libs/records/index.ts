export namespace Records {

  export function getOrThrow<K extends PropertyKey, V>(record: Record<K, V>, key: K): V {
    const value = record[key]

    if (value === undefined)
      throw new Error(`Unknown key`)

    return value
  }

  export function getOrNull<K extends PropertyKey, V>(record: Record<K, V>, key: K): V | null {
    const value = record[key]

    if (value === undefined)
      return null

    return value
  }

  export function getOrElseOrThrow<K extends PropertyKey, V>(record: Record<K, V>, key: K, fallback: K): V {
    const value = getOrNull(record, key)

    if (value != null)
      return value

    return getOrThrow(record, fallback)
  }

}