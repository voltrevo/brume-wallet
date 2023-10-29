import { ChildrenProps } from "@/libs/react/props/children"
import { ClassNameProps } from "@/libs/react/props/className"
import { Button } from "../button"

/**
 * @deprecated
 * @param props 
 * @returns 
 */
export function Shrinker(props: ChildrenProps & ClassNameProps) {
  const { children, className } = props

  return <div className={`${Button.Shrinker.className} ${className}`}>
    {children}
  </div>
}

export namespace Shrinker {

  export const className =
    `h-full w-full flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform`

}