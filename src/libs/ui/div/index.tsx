import { ChildrenProps } from "@/libs/react/props/children";

export function ContrastSubtitleDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="po-2 text-sm text-default-contrast uppercase">
    {children}
  </div>
}

export function ContrastTitleDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="po-1 font-medium text-default-contrast uppercase">
    {children}
  </div>
}