import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from "@/libs/react/props/html";
import { Button } from "../button";

export function Bordered(props: ButtonProps) {
  const { children, className, ...button } = props

  return <Button.Naked className={`text-contrast hovered-or-clicked-or-selected:text-default border border-contrast hovered-or-clicked-or-selected:border-opposite ${className}`}
    {...button}>
    {children}
  </Button.Naked>
}

export namespace Bordered {

  export function Test() {
    return <div className="p-1">
      <Button.Bordered className="p-md">
        <Button.Shrink>
          <Outline.GlobeAltIcon className="icon-sm" />
          Hello world
        </Button.Shrink>
      </Button.Bordered>
      <div className="h-1" />
      <Button.Bordered className="p-md">
        <Button.Shrink>
          Hello world
        </Button.Shrink>
      </Button.Bordered>
    </div>
  }

}