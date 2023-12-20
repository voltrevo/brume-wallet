import { Outline } from "@/libs/icons/icons"
import { ButtonProps } from "@/libs/react/props/html"
import { Button } from "../button"

/**
 * @deprecated
 * @param props 
 * @returns 
 */
export function Opposite(props: ButtonProps) {
  const { className, children, ...button } = props

  return <button className={`${Button.Base.className} ${Button.Opposite.className} ${className}`}
    {...button}>
    {children}
  </button>
}

export namespace Opposite {

  export const className =
    `text-opposite border border-opposite bg-opposite hovered-or-clicked-or-focused-or-selected:bg-transparent hovered-or-clicked-or-focused-or-selected:text-default`

  export function Test() {
    return <div className="p-1">
      <button className={`${Button.Base.className} ${className} po-md`}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.GlobeAltIcon className="size-5" />
          Hello world
        </div>
      </button>
      <div className="h-1" />
      <button className={`${Button.Base.className} ${className} po-md`}>
        <div className={`${Button.Shrinker.className}`}>
          Hello world
        </div>
      </button>
    </div>
  }

}