import { browser, tryBrowser } from "@/libs/browser/browser";
import { tryFetchAsJson } from "@/libs/fetch/fetch";
import { Outline } from "@/libs/icons/icons";
import { ChildrenProps } from "@/libs/react/props/children";
import { OkProps } from "@/libs/react/props/promise";
import { Semver } from "@/libs/semver/semver";
import { Ok, Result } from "@hazae41/result";
import { InnerChip, NakedChip } from "pages/components/buttons/chips/naked";
import { useCallback, useEffect, useState } from "react";
import { useBackground } from "../background/context";
import { registerServiceWorker } from "../service_worker/service_worker";

const MAIN_PACKAGE_URL = "https://raw.githubusercontent.com/brumewallet/wallet/main/package.json"

export function UpdateBanner(props: OkProps<unknown>) {
  const { ok } = props

  return <div className="w-full text-white bg-green-500 p-sm">
    <div className="w-full max-w-[400px] m-auto flex flex-wrap gap-2 items-center text-sm">
      <div className="grow">
        {`An update is available`}
      </div>
      <NakedChip onClick={ok}>
        <InnerChip icon={Outline.ArrowPathIcon}>
          Update
        </InnerChip>
      </NakedChip>
    </div>
  </div>
}

export function Overlay(props: ChildrenProps) {
  const { children } = props

  const background = useBackground()

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

  const background = useBackground()

  const [updating, setUpdating] = useState<ServiceWorker>()

  useEffect(() => {
    registerServiceWorker({ onUpdating: setUpdating })
  }, [background])

  const update = useCallback(() => {
    updating?.postMessage("SKIP_WAITING")
  }, [updating])

  const [updatable, setUpdatable] = useState(false)

  useEffect(() => {
    tryCheckWebsiteUpdate().then(r => r.inspectSync(setUpdatable).inspectErrSync(console.warn).ignore())
  }, [])

  const update2 = useCallback(() => {
    open("https://github.com/brumewallet/wallet/releases", "_blank", "noreferrer")
  }, [])

  return <>
    {updating && <UpdateBanner ok={update} />}
    {updatable && <UpdateBanner ok={update2} />}
    <div className="h-full w-full m-auto max-w-3xl flex flex-col">
      {children}
    </div>
  </>
}

async function tryCheckExtensionUpdate(): Promise<Result<boolean, Error>> {
  return await Result.unthrow(async t => {
    const self = await tryBrowser(() => {
      return browser.management.getSelf()
    }).then(r => r.throw(t))

    if (self.installType !== "development")
      return new Ok(false)

    const main = await tryFetchAsJson<{
      version: string
    }>(MAIN_PACKAGE_URL).then(r => r.throw(t))

    return new Ok(Semver.isGreater(main.version, self.version))
  })
}

export function ExtensionOverlay(props: ChildrenProps) {
  const { children } = props

  const [updatable, setUpdatable] = useState(false)

  useEffect(() => {
    tryCheckExtensionUpdate().then(r => r.inspectSync(setUpdatable).inspectErrSync(console.warn).ignore())
  }, [])

  const update = useCallback(() => {
    open("https://github.com/brumewallet/wallet/releases", "_blank", "noreferrer")
  }, [])

  return <div className="h-full w-full m-auto max-w-3xl flex flex-col">
    {updatable && <UpdateBanner ok={update} />}
    {children}
  </div>
}
