import { Outline } from "@/libs/icons/icons";
import { ButtonProps } from '@/libs/react/props/html';
import { Button } from "../button";

/**
 * @deprecated
 * @param props 
 * @returns 
 */
export function Base(props: ButtonProps) {
  const { className, children, ...button } = props

  return <button className={`${Base.className} ${className}`}
    {...button}>
    {children}
  </button>
}

export namespace Base {

  export const className =
    `group rounded-full outline-none disabled:opacity-50 transition-opacity`

  export function Test() {
    return <div className="p-1">
      <button className={`${className} po-md`}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.GlobeAltIcon className="size-5" />
          Hello world
        </div>
      </button>
      <div className="h-1" />
      <button className={`${className} po-md`}>
        <div className={`${Button.Shrinker.className}`}>
          Hello world
        </div>
      </button>
    </div>
  }

}