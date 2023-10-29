import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from "@/libs/react/props/html";
import { Button } from "../button";
import { Base } from "./base";

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
      <button className={`${Base.className} ${className} po-md`}>
        <Button.Shrinker>
          <Outline.GlobeAltIcon className="s-sm" />
          Hello world
        </Button.Shrinker>
      </button>
      <div className="h-1" />
      <button className={`${Base.className} ${className} po-md`}>
        <Button.Shrinker>
          Hello world
        </Button.Shrinker>
      </button>
    </div>
  }

}