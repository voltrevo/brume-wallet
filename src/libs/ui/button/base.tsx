import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from '@/libs/react/props/html';
import { Button } from "../button";

export function Base(props: ButtonProps) {
  const { className, children, ...button } = props

  return <button className={`${Base.className} ${className}`}
    {...button}>
    {children}
  </button>
}

export namespace Base {

  export const className =
    `group rounded-full outline-none
     disabled:opacity-50`

  export function Test() {
    return <div className="p-1">
      <Button.Base className="po-md">
        <Button.Shrinker>
          <Outline.GlobeAltIcon className="s-sm" />
          Hello world
        </Button.Shrinker>
      </Button.Base>
      <div className="h-1" />
      <Button.Base className="po-md">
        <Button.Shrinker>
          Hello world
        </Button.Shrinker>
      </Button.Base>
    </div>
  }

}