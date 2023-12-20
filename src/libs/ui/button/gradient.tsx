import { Gradients } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { ColorIndexProps } from "@/libs/react/props/color";
import { ButtonProps } from '@/libs/react/props/html';
import { Button } from "../button";

/**
 * @deprecated
 * @param props 
 * @returns 
 */
export function Gradient(props: ButtonProps & ColorIndexProps) {
  const { className, children, colorIndex, ...button } = props

  return <button className={`${Button.Base.className} ${Button.Gradient.className(colorIndex)} ${className}`}
    {...button}>
    {children}
  </button>
}

export namespace Gradient {

  export const className = (index: number) => {
    const [color1, color2] = Gradients.get(index)

    return `text-opposite border border-${color1} bg-gradient-to-r from-${color1} to-${color2} hovered-or-clicked-or-focused-or-selected:text-${color1} hovered-or-clicked-or-focused-or-selected:bg-none`
  }

  export function Test() {
    return <div className="p-1">
      <button className={`${Button.Base.className} ${className(5)} po-md`}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.GlobeAltIcon className="size-5" />
          Hello world
        </div>
      </button>
      <div className="h-1" />
      <button className={`${Button.Base.className} ${className(5)} po-md`}>
        <div className={`${Button.Shrinker.className}`}>
          Hello world
        </div>
      </button>
    </div>
  }

}