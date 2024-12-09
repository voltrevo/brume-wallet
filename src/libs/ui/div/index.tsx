import { ChildrenProps } from "@/libs/react/props/children";

export function ContrastSubtitleDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="po-md text-sm text-contrast uppercase">
    {children}
  </div>
}

export function ContrastTitleDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="po-sm text-contrast uppercase">
    {children}
  </div>
}