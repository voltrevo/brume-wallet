import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from "@/libs/react/props/html";
import { Button } from "../button";

export function White(props: ButtonProps) {
  const { children, className, ...button } = props

  return <Button.Naked className={`border border-transparent hovered-or-clicked-or-focused-or-selected:border-white bg-white transition ${className}`}
    {...button}>
    {children}
  </Button.Naked>
}

export namespace White {

  export function Test() {
    return <div className="p-1">
      <Button.White className="po-md">
        <Button.Shrink>
          <Outline.GlobeAltIcon className="s-sm" />
          Hello world
        </Button.Shrink>
      </Button.White>
      <div className="h-1" />
      <Button.White className="po-md">
        <Button.Shrink>
          Hello world
        </Button.Shrink>
      </Button.White>
    </div>
  }

}