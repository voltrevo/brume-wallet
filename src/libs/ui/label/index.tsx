import { ChildrenProps } from "@/libs/react/props/children"

export function ContrastLabel(props: ChildrenProps) {
  const { children } = props

  return <label className="po-2 flex flex-row items-start bg-default-contrast rounded-xl">
    {children}
  </label>
}