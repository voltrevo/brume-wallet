import { useAsyncCallback } from "@/libs/react/callback";
import { ChildrenProps } from "@/libs/react/props/children";
import { useCallback, useEffect, useState } from "react";
import { registerServiceWorker } from "../service_worker/service_worker";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  const [extension, setExtension] = useState<boolean>()

  useEffect(() => {
    setExtension(location.protocol.endsWith("extension:"))
  }, [])

  const clear = useAsyncCallback(async () => {
    const databases = await indexedDB.databases()

    for (const database of databases)
      if (database.name)
        indexedDB.deleteDatabase(database.name)

    localStorage.clear()
    location.reload()
  }, [])

  const [updating, setUpdating] = useState<ServiceWorker>()

  useEffect(() => {
    if (extension === false)
      registerServiceWorker({ onUpdating: setUpdating })
  }, [extension])

  const update = useCallback(() => {
    updating?.postMessage({ type: "SKIP_WAITING" })
  }, [updating])

  const ExperimentBanner =
    <div className="w-full text-white bg-yellow-500 p-1">
      <div className="w-full max-w-[400px] m-auto flex flex-wrap gap-2 items-center text-sm">
        <div className="grow">
          {`Experimental, use at your own risk`}
        </div>
        <button className="p-xsm border border-contrast rounded-full"
          onClick={clear}>
          Clear all storage
        </button>
      </div>
    </div>

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
      {ExperimentBanner}
      {children}
    </main>

  if (extension === false)
    return <main className="p-safe h-full w-full">
      {updating && UpdateBanner}
      {ExperimentBanner}
      <div className="h-full w-full m-auto max-w-3xl">
        {children}
      </div>
    </main>

  return null
}
