import { ChildrenProps } from "@/libs/react/props/children";
import { Bottom } from "@/mods/foreground/overlay/bottom";

export function Page(props: ChildrenProps) {
  const { children } = props

  return <>
    <div className="grow w-full flex flex-col overflow-y-scroll">
      <div className="grow w-full m-auto max-w-3xl flex flex-col">
        {children}
      </div>
    </div>
    <Bottom />
  </>
}