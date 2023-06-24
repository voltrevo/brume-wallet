import { browser, tryBrowser } from "@/libs/browser/browser";
import { tryFetchAsJson } from "@/libs/fetch/fetch";
import { Outline } from "@/libs/icons/icons";
import { ChildrenProps } from "@/libs/react/props/children";
import { OkProps } from "@/libs/react/props/promise";
import { Semver } from "@/libs/semver/semver";
import { Ok, Result } from "@hazae41/result";
import { useCallback, useEffect, useState } from "react";
import { useBackground } from "../background/context";
import { InnerButtonChip, NakedButtonChip } from "../components/buttons/chips/naked";
import { registerServiceWorker } from "../service_worker/service_worker";

const MAIN_PACKAGE_URL = "https://raw.githubusercontent.com/brumewallet/wallet/main/package.json"

export function UpdateBanner(props: OkProps<unknown>) {
  const { ok } = props

  return <div className="w-full text-white bg-green-500 p-sm">
    <div className="w-full max-w-[400px] m-auto flex flex-wrap gap-2 items-center text-sm">
      <div className="grow">
        {`An update is available`}
      </div>
      <NakedButtonChip onClick={ok}>
        <InnerButtonChip icon={Outline.ArrowPathIcon}>
          Update
        </InnerButtonChip>
      </NakedButtonChip>
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

export function WebsiteOverlay(props: ChildrenProps) {
  const { children } = props

  const background = useBackground()

  const [active, setActive] = useState<ServiceWorker>()
  const [updating, setUpdating] = useState<ServiceWorker>()

  useEffect(() => {
    registerServiceWorker({ onActive: setActive, onUpdating: setUpdating })
  }, [background])

  const update = useCallback(() => {
    updating?.postMessage("SKIP_WAITING")
  }, [updating])

  return <>
    {updating && <UpdateBanner ok={update} />}
    <div className="h-full w-full m-auto max-w-3xl flex flex-col">
      {children}
    </div>
  </>
}

async function tryCheckUpdate(): Promise<Result<boolean, Error>> {
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

  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    tryCheckUpdate().then(r => r.inspectSync(setUpdating).inspectErrSync(console.error).ignore())
  }, [])

  const update = useCallback(() => {
    open("https://github.com/brumewallet/wallet/releases", "_blank", "noreferrer")
  }, [])

  return <div className="h-full w-full m-auto max-w-3xl flex flex-col">
    {updating && <UpdateBanner ok={update} />}
    {children}
  </div>
}
