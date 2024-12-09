import { ChildrenProps } from "@/libs/react/props/children"

export function ContrastLabel(props: ChildrenProps) {
  const { children } = props

  return <label className="po-md flex items-start bg-contrast rounded-xl">
    {children}
  </label>
}