export namespace Maps {

  export function getOrCreate<K, V>(map: Map<K, NonNullable<V>>, key: K, factory: () => NonNullable<V>) {
    let value = map.get(key)

    if (value == null) {
      value = factory()
      map.set(key, value)
    }

    return value
  }

}