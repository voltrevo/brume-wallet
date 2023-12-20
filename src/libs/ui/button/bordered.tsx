import { Outline } from "@/libs/icons/icons";
import { Button } from "../button";

export namespace Bordered {

  export const className =
    `text-contrast border border-contrast hovered-or-clicked-or-focused-or-selected:text-default hovered-or-clicked-or-focused-or-selected:border-opposite`

  export function Test() {
    return <div className="p-1">
      <button className={`${Button.Base.className} ${className} po-md`}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.GlobeAltIcon className="size-5" />
          Hello world
        </div>
      </button>
      <div className="h-1" />
      <button className={`${Button.Base.className} ${className} po-md`}>
        <div className={`${Button.Shrinker.className}`}>
          Hello world
        </div>
      </button>
    </div>
  }

}