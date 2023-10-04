export namespace Maps {

  export function getOrCreate<K, V>(map: Map<K, NonNullable<V>>, key: K, factory: () => NonNullable<V>) {
    let value = map.get(key)

    if (value == null) {
      value = factory()
      map.set(key, value)
    }

    return value
  }

  function* entry<K, V>(entries: Iterable<[K, V]>) {
    for (const [key, value] of entries)
      yield { key, value }
  }

  export function entries<K, V>(map: Map<K, V>) {
    return entry(map.entries())
  }

}