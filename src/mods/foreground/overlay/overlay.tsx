import { browser } from "@/libs/browser/browser";
import { ChildrenProps } from "@/libs/react/props/children";
import { useCallback, useEffect, useState } from "react";
import { registerServiceWorker } from "../service_worker/service_worker";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  const [extension, setExtension] = useState<boolean>()

  useEffect(() => {
    setExtension(location.protocol.endsWith("extension:"))
  }, [])

  const [active, setActive] = useState<ServiceWorker>()
  const [updating, setUpdating] = useState<ServiceWorker>()
  const [port, setPort] = useState<chrome.runtime.Port>()

  useEffect(() => {
    if (extension === true)
      setPort(browser.runtime.connect({ name: "foreground" }))
    if (extension === false)
      registerServiceWorker({ onActive: setActive, onUpdating: setUpdating })
  }, [extension])

  const update = useCallback(() => {
    updating?.postMessage({ type: "SKIP_WAITING" })
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

  if (extension === true)
    return <main className="h-[600px] w-[400px] overflow-y-scroll">
      {children}
    </main>

  if (extension === false)
    return <main className="p-safe h-full w-full">
      {updating && UpdateBanner}
      <div className="h-full w-full m-auto max-w-3xl">
        {children}
      </div>
    </main>

  return null
}
