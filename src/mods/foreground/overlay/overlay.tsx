import { ChildrenProps } from "@/libs/react/props/children";
import { useCallback, useEffect, useState } from "react";
import { ExtensionBackgroundsProvider, WebsiteBackgroundsProvider } from "../background/context";
import { useExtension } from "../extension/context";
import { registerServiceWorker } from "../service_worker/service_worker";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  const extension = useExtension()

  const [active, setActive] = useState<ServiceWorker>()
  const [updating, setUpdating] = useState<ServiceWorker>()

  useEffect(() => {
    if (extension)
      return
    registerServiceWorker({ onActive: setActive, onUpdating: setUpdating })
  }, [extension])

  const update = useCallback(() => {
    updating?.postMessage("SKIP_WAITING")
  }, [updating])

  const UpdateBanner =
    <div className="w-full text-white bg-green-500 p-1">
      <div className="w-full max-w-[400px] m-auto flex flex-wrap gap-2 items-center text-sm">
        <div className="grow">
          {`An update is available`}
        </div>
        <button className="p-xsm border border-contrast rounded-full"
          onClick={update}>
          Update
        </button>
      </div>
    </div>

  if (extension)
    return <ExtensionBackgroundsProvider>
      <main className="h-[600px] w-[400px] overflow-y-scroll">
        {children}
      </main>
    </ExtensionBackgroundsProvider>

  return <WebsiteBackgroundsProvider>
    <main className="p-safe h-full w-full">
      {updating && UpdateBanner}
      <div className="h-full w-full m-auto max-w-3xl">
        {children}
      </div>
    </main>
  </WebsiteBackgroundsProvider>
}
