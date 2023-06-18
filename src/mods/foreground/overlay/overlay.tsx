import { ChildrenProps } from "@/libs/react/props/children";
import { useCallback, useEffect, useState } from "react";
import { useBackground } from "../background/context";
import { registerServiceWorker } from "../service_worker/service_worker";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  const background = useBackground()

  const [active, setActive] = useState<ServiceWorker>()
  const [updating, setUpdating] = useState<ServiceWorker>()

  useEffect(() => {
    if (!background.isWebsite())
      return
    registerServiceWorker({ onActive: setActive, onUpdating: setUpdating })
  }, [background])

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

  if (background)
    return <div className="h-full w-full m-auto max-w-3xl">
      {children}
    </div>

  return <>
    {updating && UpdateBanner}
    <div className="h-full w-full m-auto max-w-3xl">
      {children}
    </div>
  </>
}
