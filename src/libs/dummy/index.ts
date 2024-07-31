export function createDummy<T extends object>(name: string, target: T): T {
  const dummy = {}

  return new Proxy(target, {
    get(_: T, property: string, receiver: any) {
      if (property in dummy)
        return Reflect.get(dummy, property, receiver)
      else
        return Reflect.get(target, property, receiver)
    },
    set(_: T, property: string, value: any, receiver: any) {
      return Reflect.set(dummy, property, value, receiver)
    }
  })
}