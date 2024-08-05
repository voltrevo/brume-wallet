import { AnchorProps } from "@/libs/react/props/html";

export function TextAnchor(props: AnchorProps) {
  const { href, children = href, target = "_blank", rel = "noreferrer", ...others } = props

  return <a className="text-colored focus-visible:underline"
    href={href}
    target={target}
    rel={rel}
    {...others}>
    {children}
  </a>
}