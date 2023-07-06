import { Gradients } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { ColorIndexProps } from "@/libs/react/props/color";
import { ButtonProps } from '@/libs/react/props/html';
import { Button } from "../button";

export function Gradient(props: ButtonProps & ColorIndexProps) {
  const { className, children, colorIndex, ...button } = props

  const [color1, color2] = Gradients.get(colorIndex)

  return <Button.Naked className={`text-opposite hovered-or-clicked-or-focused-or-selected:text-${color1} border border-${color1} bg-gradient-to-r from-${color1} to-${color2} hovered-or-clicked-or-focused-or-selected:bg-none transition ${className}`}
    {...button}>
    {children}
  </Button.Naked>
}

export namespace Gradient {

  export function Test() {
    return <div className="p-1">
      <Button.Gradient className="p-md"
        colorIndex={5}>
        <Button.Shrink>
          <Outline.GlobeAltIcon className="icon-sm" />
          Hello world
        </Button.Shrink>
      </Button.Gradient>
      <div className="h-1" />
      <Button.Gradient className="p-md"
        colorIndex={5}>
        <Button.Shrink>
          Hello world
        </Button.Shrink>
      </Button.Gradient>
    </div>
  }

}