import { useAsyncCallback } from "@/libs/react/callback";
import { ChildrenProps } from "@/libs/react/props/children";
import { useEffect, useState } from "react";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  const [extension, setExtension] = useState(false)

  useEffect(() => {
    if (location.protocol === "chrome-extension:")
      setExtension(true)
  }, [])

  const clear = useAsyncCallback(async () => {
    const databases = await indexedDB.databases()

    for (const database of databases)
      if (database.name)
        indexedDB.deleteDatabase(database.name)

    localStorage.clear()
    location.reload()
  }, [])

  const Banner =
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

  if (extension)
    return <main className="h-[600px] w-[400px] overflow-y-scroll">
      {Banner}
      {children}
    </main>

  return <main className="p-safe h-full w-full">
    {Banner}
    <div className="h-full w-full m-auto max-w-3xl">
      {children}
    </div>
  </main>
}
