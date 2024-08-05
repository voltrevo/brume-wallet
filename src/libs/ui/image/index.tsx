import { ChildrenProps } from "@/libs/react/props/children"
import { ImageProps } from "@/libs/react/props/html"
import { SyntheticEvent, useCallback, useEffect, useState } from "react"

export function ImageWithFallback(props: ImageProps & ChildrenProps) {
  const { children, src, onError, ...img } = props

  const [error, setError] = useState(false)
  useEffect(() => setError(false), [src])

  const onError2 = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    setError(true)
    return onError?.(event)
  }, [onError])

  if (error)
    return <>{children}</>
  if (src == null)
    return <>{children}</>

  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  return <img src={src} onError={onError2} {...img} />
}