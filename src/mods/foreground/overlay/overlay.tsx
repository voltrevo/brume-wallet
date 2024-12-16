import { Outline } from "@/libs/icons/icons";
import { isExtension, isWebsite } from "@/libs/platform/platform";
import { ChildrenProps } from "@/libs/react/props/children";
import { RoundedClickableNakedButton, SmallAndRoundedClickableOppositeButton } from "@/libs/ui/button";
import { useCallback, useEffect, useState } from "react";
import { ServiceWorkerBackground } from "../background/background";
import { useBackgroundContext } from "../background/context";

export function UpdateBanner(props: {
  readonly update: () => void
  readonly ignore: () => void
}) {
  const { update, ignore } = props

  return <div className="w-full text-white bg-green-500 po-sm flex flex-wrap gap-2 items-center">
    <div className="grow flex items-center justify-center">
      <div className="grow max-w-[400px] flex flex-wrap gap-2 items-center">
        <div className="grow text-sm font-medium">
          {`An update is available`}
        </div>
        <SmallAndRoundedClickableOppositeButton
          onClick={update}>
          <Outline.ArrowPathIcon className="size-4" />
          Update
        </SmallAndRoundedClickableOppositeButton>
      </div>
    </div>
    <RoundedClickableNakedButton
      onClick={ignore}>
      <Outline.XMarkIcon className="size-5" />
    </RoundedClickableNakedButton>
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

  const background = useBackgroundContext().getOrThrow() as ServiceWorkerBackground

  const [update, setUpdate] = useState<() => void>()

  useEffect(() => {
    const onUpdate = (update: () => void) => setUpdate(() => update)

    return background.serviceWorker.on("update", onUpdate)
  }, [background])

  const ignore = useCallback(() => {
    setUpdate(undefined)
  }, [])

  console.log("update", update)

  return <>
    {update && <UpdateBanner
      update={update}
      ignore={ignore} />}
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