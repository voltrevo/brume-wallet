export type SafeInteger = number & { __integer: true }

export type PositiveSafeInteger = SafeInteger & { __positive: true }

export namespace PositiveSafeInteger {
  export function is(x: number): x is PositiveSafeInteger {
    return !Number.isNaN(x) && Number.isSafeInteger(x) && x >= 0
  }
}