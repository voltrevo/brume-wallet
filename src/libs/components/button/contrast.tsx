import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from "@/libs/react/props/html";
import { Button } from "../button";

export function Contrast(props: ButtonProps) {
  const { children, className, ...button } = props

  return <Button.Naked className={`text-contrast hovered-or-active-or-selected:text-default border border-contrast hovered-or-active-or-selected:border-opposite ${className}`}
    {...button}>
    {children}
  </Button.Naked>
}

export namespace Contrast {

  export function Test() {
    return <div className="p-1">
      <Button.Contrast className="p-md">
        <Button.Shrink>
          <Outline.GlobeAltIcon className="icon-sm" />
          Hello world
        </Button.Shrink>
      </Button.Contrast>
      <div className="h-1" />
      <Button.Contrast className="p-md">
        <Button.Shrink>
          Hello world
        </Button.Shrink>
      </Button.Contrast>
    </div>
  }

}