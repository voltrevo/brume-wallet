import { Fixed } from "@hazae41/cubane"
import { useMemo } from "react"

export function useDisplayRaw(fixed: Fixed.From = new Fixed(0n, 18), locale: string) {
  return useMemo(() => {
    const fixed5 = Fixed.from(fixed).move(18)
    const float = Number(fixed5.toString())

    if (float > (10 ** 9))
      return float.toLocaleString(locale, {
        style: "decimal",
        notation: "scientific",
        roundingMode: "trunc",
        maximumSignificantDigits: 18,
      })

    return float.toLocaleString(locale, {
      style: "decimal",
      notation: "standard",
      roundingMode: "trunc",
      maximumSignificantDigits: 18,
    })
  }, [fixed])
}

export function useDisplayUsd(fixed: Fixed.From = new Fixed(0n, 18), locale: string) {
  return useMemo(() => {
    const fixed2 = Fixed.from(fixed).move(18)
    const float = Number(fixed2.toString())

    if (float > (10 ** 9))
      return float.toLocaleString(locale, {
        style: "currency",
        currency: "USD",
        currencyDisplay: "code",
        notation: "scientific",
        roundingMode: "trunc",
        maximumSignificantDigits: 18,
      })

    return float.toLocaleString(locale, {
      style: "currency",
      currency: "USD",
      currencyDisplay: "code",
      notation: "standard",
      roundingMode: "trunc",
      maximumSignificantDigits: 18,
    })
  }, [fixed])
}

export function useCompactDisplayRaw(fixed: Fixed.From = new Fixed(0n, 18), locale: string) {
  return useMemo(() => {
    const fixed5 = Fixed.from(fixed).move(18)
    const float = Number(fixed5.toString())

    if (float > (10 ** 9))
      return float.toLocaleString(locale, {
        style: "decimal",
        notation: "scientific",
        roundingMode: "trunc",
        maximumSignificantDigits: 3,
      })

    return float.toLocaleString(locale, {
      style: "decimal",
      notation: "compact",
      roundingMode: "trunc",
      maximumSignificantDigits: 3,
    })
  }, [fixed])
}

export function useCompactDisplayUsd(fixed: Fixed.From = new Fixed(0n, 18), locale: string) {
  return useMemo(() => {
    const fixed2 = Fixed.from(fixed).move(18)
    const float = Number(fixed2.toString())

    if (float > (10 ** 9))
      return float.toLocaleString(locale, {
        style: "currency",
        currency: "USD",
        currencyDisplay: "narrowSymbol",
        notation: "scientific",
        roundingMode: "trunc",
        maximumSignificantDigits: 3,
      })

    return float.toLocaleString(locale, {
      style: "currency",
      currency: "USD",
      currencyDisplay: "narrowSymbol",
      notation: "compact",
      roundingMode: "trunc",
      maximumSignificantDigits: 3,
    })
  }, [fixed])
}