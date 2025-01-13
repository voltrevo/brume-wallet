import { Outline } from "@/libs/icons/icons";
import { isExtension, isWebsite } from "@/libs/platform/platform";
import { ChildrenProps } from "@/libs/react/props/children";
import { OkProps } from "@/libs/react/props/promise";
import { RoundedClickableNakedButton, WideClickableOppositeButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { useCallback, useEffect, useState } from "react";
import { ServiceWorkerBackground } from "../background/background";
import { useBackgroundContext } from "../background/context";

export function UpdateBanner(props: {
  readonly update: () => void
  readonly ignore: () => void
}) {
  const path = usePathContext().getOrThrow()
  const { update, ignore } = props

  const hash = useHashSubpath(path)

  const coords = useCoords(hash, "/update")

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === "/update" &&
        <Dialog>
          <UpdateDialog ok={update} />
        </Dialog>}
    </HashSubpathProvider>
    <div className="w-full text-white bg-green-500 po-sm flex flex-wrap gap-2 items-center">
      <a className="grow text-center text-sm hover:underline"
        onClick={coords.onClick}
        onKeyDown={coords.onKeyDown}
        href={coords.href}>
        {`An update seems available`}
      </a>
      <RoundedClickableNakedButton
        onClick={ignore}>
        <Outline.XMarkIcon className="size-5" />
      </RoundedClickableNakedButton>
    </div>
  </>
}

export function UpdateDialog(props: OkProps<void>) {
  const { ok } = props

  const onUpdateClick = useCallback(() => {
    ok()
  }, [ok])

  return <>
    <Dialog.Title>
      An update seems available
    </Dialog.Title>
    <div className="h-4" />
    <div className="text-contrast">
      {`To avoid any ongoing attack, please confirm by multiple social channels that this update is legitimate.`}
    </div>
    <div className="h-2" />
    <div className="text-contrast">
      {`If something seems wrong or suspicious BEFORE updating, ignore this update and contact the developer immediately. Your current version is probably still safe to use if you don't use Safari.`}
    </div>
    <div className="h-2" />
    <div className="text-contrast">
      {`If something seems wrong or suspicious AFTER updating, do not login and contact the developer immediately. Use a previous version of the application to migrate your funds if necessary.`}
    </div>
    <div className="h-2" />
    <div className="text-contrast">
      {`If you want extra security, you can enable developer tools, choose to preserve the network logs, click the button below to update, and then verify the update by comparing the hash of the downloaded "service_worker.xxxxxx.js" with the one provided by the developer.`}
    </div>
    <div className="h-8" />
    <div className="flex justify-center">
      <img className="h-[300px] w-auto"
        src="/assets/verify.png" />
    </div>
    <div className="h-4 grow" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      <WideClickableOppositeButton
        onClick={onUpdateClick}>
        <Outline.ArrowPathIcon className="size-5" />
        Update
      </WideClickableOppositeButton>
    </div>
  </>
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