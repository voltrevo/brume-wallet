import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from "@/libs/react/props/html";
import { Button } from "../button";

/**
 * @deprecated
 * @param props 
 * @returns 
 */
export function Contrast(props: ButtonProps) {
  const { children, className, ...button } = props

  return <button className={`${Button.Base.className} ${Button.Contrast.className} ${className}`}
    {...button}>
    {children}
  </button>
}

export namespace Contrast {

  export const className =
    `text-default border border-transparent bg-contrast hovered-or-clicked-or-focused-or-selected:border-opposite transition-border-and-opacity`

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