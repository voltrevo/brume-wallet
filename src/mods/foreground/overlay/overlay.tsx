import { Outline } from "@/libs/icons/icons";
import { isExtension, isWebsite } from "@/libs/platform/platform";
import { ChildrenProps } from "@/libs/react/props/children";
import { OkProps } from "@/libs/react/props/promise";
import { Button } from "@/libs/ui/button";
import { None } from "@hazae41/option";
import { useEffect, useState } from "react";
import { ServiceWorkerBackground } from "../background/background";
import { useBackgroundContext } from "../background/context";

export function UpdateBanner(props: OkProps<unknown>) {
  const { ok } = props

  return <div className="w-full text-white bg-green-500 po-sm">
    <div className="w-full max-w-[400px] m-auto flex flex-wrap gap-2 items-center text-sm">
      <div className="grow">
        {`An update is available`}
      </div>
      <Button.Base className="hovered-or-clicked-or-focused:scale-105 !transition"
        onClick={ok}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.ArrowPathIcon className="size-5" />
          Update
        </div>
      </Button.Base>
    </div>
  </div>
}

export function Overlay(props: ChildrenProps) {
  const { children } = props

  if (isWebsite())
    return <WebsiteOverlay>
      {children}
    </WebsiteOverlay>

  if (isExtension())
    return <ExtensionOverlay>
      {children}
    </ExtensionOverlay>

  return <OtherOverlay>
    {children}
  </OtherOverlay>
}

export function WebsiteOverlay(props: ChildrenProps) {
  const { children } = props

  const background = useBackgroundContext().unwrap() as ServiceWorkerBackground

  const [update, setUpdate] = useState<() => void>()

  useEffect(() => {
    const onUpdate = (update: () => void) => {
      setUpdate(update)
      return new None()
    }

    return background.serviceWorker.on("update", onUpdate)
  }, [background])

  return <>
    {update && <UpdateBanner ok={update} />}
    {children}
  </>
}

export function ExtensionOverlay(props: ChildrenProps) {
  const { children } = props

  return <>
    {children}
  </>
}

export function OtherOverlay(props: ChildrenProps) {
  const { children } = props

  return <>
    {children}
  </>
}