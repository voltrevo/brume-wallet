import { browser, tryBrowser } from "@/libs/browser/browser";
import { tryFetchAsJson } from "@/libs/fetch/fetch";
import { Outline } from "@/libs/icons/icons";
import { ChildrenProps } from "@/libs/react/props/children";
import { OkProps } from "@/libs/react/props/promise";
import { Semver } from "@/libs/semver/semver";
import { Button } from "@/libs/ui/button";
import { None } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { useCallback, useEffect, useState } from "react";
import { useBackground } from "../background/context";

const MAIN_PACKAGE_URL = "https://raw.githubusercontent.com/brumewallet/wallet/main/package.json"

export function UpdateBanner(props: OkProps<unknown>) {
  const { ok } = props

  return <div className="w-full text-white bg-green-500 po-sm">
    <div className="w-full max-w-[400px] m-auto flex flex-wrap gap-2 items-center text-sm">
      <div className="grow">
        {`An update is available`}
      </div>
      <Button.Naked className="hovered-or-clicked-or-focused:scale-105 transition"
        onClick={ok}>
        <Button.Shrink>
          <Outline.ArrowPathIcon className="s-sm" />
          Update
        </Button.Shrink>
      </Button.Naked>
    </div>
  </div>
}

export function Overlay(props: ChildrenProps) {
  const { children } = props

  const background = useBackground().unwrap()

  if (background.isExtension())
    return <ExtensionOverlay>
      {children}
    </ExtensionOverlay>

  if (background.isWebsite())
    return <WebsiteOverlay>
      {children}
    </WebsiteOverlay>

  return null
}

async function tryCheckWebsiteUpdate(): Promise<Result<boolean, Error>> {
  return await Result.unthrow(async t => {
    const cached = await tryFetchAsJson<{
      version: string
    }>("/manifest.json").then(r => r.throw(t))

    const current = await tryFetchAsJson<{
      version: string
    }>("/manifest.json?").then(r => r.throw(t))

    if (current.version !== cached.version)
      return new Ok(false) // Will be handled by SW

    const main = await tryFetchAsJson<{
      version: string
    }>(MAIN_PACKAGE_URL).then(r => r.throw(t))

    return new Ok(Semver.isGreater(main.version, cached.version))
  })
}

export function WebsiteOverlay(props: ChildrenProps) {
  const { children } = props

  const background = useBackground().unwrap()

  const [updating, setUpdating] = useState<ServiceWorker>()

  useEffect(() => {
    if (!background.isWebsite())
      return

    const onUpdate = (sw: ServiceWorker) => {
      setUpdating(sw)
      return new None()
    }

    return background.sw.on("update", onUpdate)
  }, [background])

  const update = useCallback(() => {
    updating?.postMessage("SKIP_WAITING")
  }, [updating])

  const [updatable, setUpdatable] = useState(false)

  useEffect(() => {
    tryCheckWebsiteUpdate().then(r => r.inspectSync(setUpdatable).inspectErrSync(console.warn))
  }, [])

  const update2 = useCallback(() => {
    open("https://github.com/brumewallet/wallet/releases", "_blank", "noreferrer")
  }, [])

  return <>
    {updating && <UpdateBanner ok={update} />}
    {updatable && <UpdateBanner ok={update2} />}
    <div className="grow w-full m-auto max-w-3xl flex flex-col">
      {children}
    </div>
  </>
}

async function tryCheckDevExtensionUpdate(self: chrome.management.ExtensionInfo): Promise<Result<boolean, Error>> {
  return await Result.unthrow(async t => {
    const main = await tryFetchAsJson<{
      version: string
    }>(MAIN_PACKAGE_URL).then(r => r.throw(t))

    return new Ok(Semver.isGreater(main.version, self.version))
  })
}

async function tryCheckExtensionUpdate(): Promise<Result<boolean, Error>> {
  return await Result.unthrow(async t => {
    const self = await tryBrowser(() => {
      return browser.management.getSelf()
    }).then(r => r.throw(t))

    if (self.installType === "development")
      return await tryCheckDevExtensionUpdate(self)

    return new Ok(false)
  })
}

export function ExtensionOverlay(props: ChildrenProps) {
  const { children } = props

  const [updatable, setUpdatable] = useState(false)

  useEffect(() => {
    tryCheckExtensionUpdate().then(r => r.inspectSync(setUpdatable).inspectErrSync(console.warn))
  }, [])

  const update = useCallback(() => {
    open("https://github.com/brumewallet/wallet/releases", "_blank", "noreferrer")
  }, [])

  return <div className="grow w-full m-auto max-w-3xl flex flex-col">
    {updatable && <UpdateBanner ok={update} />}
    {children}
  </div>
}
