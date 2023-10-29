import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from "@/libs/react/props/html";
import { Button } from "../button";

export function Bordered(props: ButtonProps) {
  const { children, className, ...button } = props

  return <Button.Base className={`${Button.Base.className} ${Button.Bordered.className} ${className}`}
    {...button}>
    {children}
  </Button.Base>
}

export namespace Bordered {

  export const className =
    `text-contrast border border-contrast transition
     hovered-or-clicked-or-focused-or-selected:text-default
     hovered-or-clicked-or-focused-or-selected:border-opposite`

  export function Test() {
    return <div className="p-1">
      <Button.Bordered className="po-md">
        <Button.Shrinker>
          <Outline.GlobeAltIcon className="s-sm" />
          Hello world
        </Button.Shrinker>
      </Button.Bordered>
      <div className="h-1" />
      <Button.Bordered className="po-md">
        <Button.Shrinker>
          Hello world
        </Button.Shrinker>
      </Button.Bordered>
    </div>
  }

}