import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from '@/libs/react/props/html';
import { Button } from "../button";

export function Naked(props: ButtonProps) {
  const { className, children, ...button } = props

  return <button className={`group disabled:opacity-50 rounded-full ${className}`}
    {...button}>
    {children}
  </button>
}

export namespace Naked {

  export function Test() {
    return <div className="p-1">
      <Button.Naked className="p-md">
        <Button.Shrink>
          <Outline.GlobeAltIcon className="icon-sm" />
          Hello world
        </Button.Shrink>
      </Button.Naked>
      <div className="h-1" />
      <Button.Naked className="p-md">
        <Button.Shrink>
          Hello world
        </Button.Shrink>
      </Button.Naked>
    </div>
  }

}