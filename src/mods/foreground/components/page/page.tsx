import { ChildrenProps } from "@/libs/react/props/children";

export function Page(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full w-full flex flex-col">
    {children}
  </div>
}