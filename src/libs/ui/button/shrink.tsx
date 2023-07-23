import { ChildrenProps } from "@/libs/react/props/children"
import { ClassNameProps } from "@/libs/react/props/className"
import { Button } from "../button"

export function Shrink(props: ChildrenProps & ClassNameProps) {
  const { children, className } = props

  return <div className={`${Button.Shrink.className} ${className}`}>
    {children}
  </div>
}

export namespace Shrink {

  export const className =
    `h-full w-full flex justify-center items-center gap-2 transition
     group-enabled:group-active:scale-90`

}