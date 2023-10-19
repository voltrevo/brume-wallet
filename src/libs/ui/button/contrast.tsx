import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from "@/libs/react/props/html";
import { Button } from "../button";

export function Contrast(props: ButtonProps) {
  const { children, className, ...button } = props

  return <Button.Naked className={`${Button.Naked.className} ${Button.Contrast.className} ${className}`}
    {...button}>
    {children}
  </Button.Naked>
}

export namespace Contrast {

  export const className =
    `text-default border border-transparent bg-contrast transition
     hovered-or-clicked-or-focused-or-selected:border-opposite`

  export function Test() {
    return <div className="p-1">
      <Button.Contrast className="po-md">
        <Button.Shrinker>
          <Outline.GlobeAltIcon className="s-sm" />
          Hello world
        </Button.Shrinker>
      </Button.Contrast>
      <div className="h-1" />
      <Button.Contrast className="po-md">
        <Button.Shrinker>
          Hello world
        </Button.Shrinker>
      </Button.Contrast>
    </div>
  }

}