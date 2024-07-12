import { BrowserError, browser } from "@/libs/browser/browser";
import { fetchAsJsonOrThrow } from "@/libs/fetch";
import { Outline } from "@/libs/icons/icons";
import { isExtension, isWebsite } from "@/libs/platform/platform";
import { ChildrenProps } from "@/libs/react/props/children";
import { OkProps } from "@/libs/react/props/promise";
import { Semver } from "@/libs/semver/semver";
import { Button } from "@/libs/ui/button";
import { None } from "@hazae41/option";
import { useCallback, useEffect, useState } from "react";
import { ServiceWorkerBackground } from "../background/background";
import { useBackgroundContext } from "../background/context";

const MAIN_PACKAGE_URL = "https://raw.githubusercontent.com/brumewallet/wallet/main/package.json"

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

async function checkWebsiteUpdateOrThrow(): Promise<boolean> {
  const cached = await fetchAsJsonOrThrow<{
    version: string
  }>("/manifest.json")

  const current = await fetchAsJsonOrThrow<{
    version: string
  }>("/manifest.json?")

  if (current.version !== cached.version)
    return false // Will be handled by SW

  const main = await fetchAsJsonOrThrow<{
    version: string
  }>(MAIN_PACKAGE_URL)

  return Semver.isGreater(main.version, cached.version)
}

export function WebsiteOverlay(props: ChildrenProps) {
  const { children } = props

  const background = useBackgroundContext().unwrap() as ServiceWorkerBackground

  const [updating, setUpdating] = useState<ServiceWorker>()

  useEffect(() => {
    const onUpdate = (sw: ServiceWorker) => {
      setUpdating(sw)
      return new None()
    }

    return background.serviceWorker.on("update", onUpdate)
  }, [background])

  const update = useCallback(() => {
    updating?.postMessage("SKIP_WAITING")
  }, [updating])

  const [updatable, setUpdatable] = useState(false)

  useEffect(() => {
    checkWebsiteUpdateOrThrow().then(setUpdatable).catch(console.warn)
  }, [])

  const update2 = useCallback(() => {
    open("https://github.com/brumewallet/wallet/releases", "_blank", "noreferrer")
  }, [])

  return <>
    {updating && <UpdateBanner ok={update} />}
    {updatable && <UpdateBanner ok={update2} />}
    {children}
  </>
}

async function checkDevExtensionUpdateOrThrow(self: chrome.management.ExtensionInfo): Promise<boolean> {
  const main = await fetchAsJsonOrThrow<{ version: string }>(MAIN_PACKAGE_URL)

  return Semver.isGreater(main.version, self.version)
}

async function checkExtensionUpdateOrThrow(): Promise<boolean> {
  const self = await BrowserError.runOrThrow(() => browser.management.getSelf())

  if (self.installType === "development")
    return await checkDevExtensionUpdateOrThrow(self)

  return false
}

export function ExtensionOverlay(props: ChildrenProps) {
  const { children } = props

  const [updatable, setUpdatable] = useState(false)

  useEffect(() => {
    checkExtensionUpdateOrThrow().then(setUpdatable).catch(console.warn)
  }, [])

  const update = useCallback(() => {
    open("https://github.com/brumewallet/wallet/releases", "_blank", "noreferrer")
  }, [])

  return <>
    {updatable && <UpdateBanner ok={update} />}
    {children}
  </>
}

export function OtherOverlay(props: ChildrenProps) {
  const { children } = props

  const [updatable, setUpdatable] = useState(false)

  useEffect(() => {
    // TODO 
  }, [])

  const update = useCallback(() => {
    open("https://github.com/brumewallet/wallet/releases", "_blank", "noreferrer")
  }, [])

  return <>
    {updatable && <UpdateBanner ok={update} />}
    {children}
  </>
}