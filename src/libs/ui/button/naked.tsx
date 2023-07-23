import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from '@/libs/react/props/html';
import { Button } from "../button";

export function Naked(props: ButtonProps) {
  const { className, children, ...button } = props

  return <button className={`${Naked.className} ${className}`}
    {...button}>
    {children}
  </button>
}

export namespace Naked {

  export const className =
    `group rounded-full outline-none
     disabled:opacity-50`

  export function Test() {
    return <div className="p-1">
      <Button.Naked className="po-md">
        <Button.Shrink>
          <Outline.GlobeAltIcon className="s-sm" />
          Hello world
        </Button.Shrink>
      </Button.Naked>
      <div className="h-1" />
      <Button.Naked className="po-md">
        <Button.Shrink>
          Hello world
        </Button.Shrink>
      </Button.Naked>
    </div>
  }

}