import { ChildrenProps } from "@/libs/react/props/children";

export function Page(props: ChildrenProps) {
  const { children } = props

  return <>
    {children}
  </>
}