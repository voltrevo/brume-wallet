import { ChildrenProps } from "@/libs/react/props/children";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  return <div className="m-auto max-w-lg">
    {children}
  </div>
}