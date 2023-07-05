import { Outline } from "@/libs/icons/icons"
import { ButtonProps } from "@/libs/react/props/html"
import { Button } from "../button"
import { Naked } from "./naked"

export function Opposite(props: ButtonProps) {
  const { className, children, ...button } = props

  return <Naked className={`text-opposite hovered-or-active-or-selected:text-default border border-opposite bg-opposite hovered-or-active-or-selected:bg-transparent transition ${className}`}
    {...button}>
    {children}
  </Naked>
}

export namespace Opposite {

  export function Test() {
    return <div className="p-1">
      <Button.Opposite className="p-md">
        <Button.Shrink>
          <Outline.GlobeAltIcon className="icon-sm" />
          Hello world
        </Button.Shrink>
      </Button.Opposite>
      <div className="h-1" />
      <Button.Opposite className="p-md">
        <Button.Shrink>
          Hello world
        </Button.Shrink>
      </Button.Opposite>
    </div>
  }

}