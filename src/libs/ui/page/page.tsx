import { Outline } from "@/libs/icons/icons";
import { ChildrenProps } from "@/libs/react/props/children";
import { Bottom } from "@/mods/foreground/overlay/bottom";

export function Page(props: ChildrenProps) {
  const { children } = props

  return <>
    <div className="grow w-full flex flex-col overflow-y-scroll">
      <div className="invisible md:visible po-md border-b-contrast">
        <div className="grow w-full m-auto max-w-6xl flex items-center">
          <div className="flex-1 flex items-center">
            <img className="size-8"
              alt="Brume Wallet"
              src="/favicon.png" />
            <div className="w-2" />
            <div className="font-medium">
              Wallet
            </div>
          </div>
          <div className="w-2" />
          <div className="flex-1 flex items-center po-md bg-contrast rounded-xl">
            <Outline.SparklesIcon className="size-4" />
            <div className="w-2" />
            <input className="w-full bg-transparent outline-none"
              placeholder="tell me what you want" />
          </div>
          <div className="w-2" />
          <div className="flex-1" />
        </div>
      </div>
      <div className="p-4 grow w-full m-auto max-w-3xl flex flex-col">
        {children}
      </div>
    </div>
    <Bottom />
  </>
}