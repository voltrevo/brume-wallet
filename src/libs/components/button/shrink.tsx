import { ChildrenProps } from "@/libs/react/props/children"
import { ClassNameProps } from "@/libs/react/props/className"

export function Shrink(props: ChildrenProps & ClassNameProps) {
  const { children, className } = props

  return <div className={`h-full w-full flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform ${className}`}>
    {children}
  </div>
}