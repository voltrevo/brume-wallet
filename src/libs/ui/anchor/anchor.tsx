import { AnchorProps } from "@/libs/react/props/html";

export function TextAnchor(props: AnchorProps) {
  const { className, href, children = href, target = "_blank", rel = "noreferrer", ...others } = props

  return <a className={`a ${className}`}
    href={href}
    target={target}
    rel={rel}
    {...others}>
    {children}
  </a>
}