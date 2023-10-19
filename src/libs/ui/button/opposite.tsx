import { Outline } from "@/libs/icons/icons"
import { ButtonProps } from "@/libs/react/props/html"
import { Button } from "../button"

export function Opposite(props: ButtonProps) {
  const { className, children, ...button } = props

  return <button className={`${Button.Naked.className} ${Button.Opposite.className} ${className}`}
    {...button}>
    {children}
  </button>
}

export namespace Opposite {

  export const className =
    `text-opposite border border-opposite bg-opposite transition
     hovered-or-clicked-or-focused-or-selected:bg-transparent
     hovered-or-clicked-or-focused-or-selected:text-default`

  export function Test() {
    return <div className="p-1">
      <Button.Opposite className="po-md">
        <Button.Shrinker>
          <Outline.GlobeAltIcon className="s-sm" />
          Hello world
        </Button.Shrinker>
      </Button.Opposite>
      <div className="h-1" />
      <Button.Opposite className="po-md">
        <Button.Shrinker>
          Hello world
        </Button.Shrinker>
      </Button.Opposite>
    </div>
  }

}