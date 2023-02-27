import { useCallback } from "react"
import { AnchorProps, DivisionProps } from "../react/props/html"

export function ExternalDivisionLink(props: AnchorProps & DivisionProps) {
  const { href, ...others } = props

  const onClick = useCallback(() => {
    open(href, "_blank", "noreferrer")
  }, [href])

  if (!href) return <div {...others} />

  return <div onClick={onClick} {...others} />
}