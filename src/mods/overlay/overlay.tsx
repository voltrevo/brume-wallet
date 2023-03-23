import { ChildrenProps } from "@/libs/react/props/children";
import { useEffect, useState } from "react";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  const [extension, setExtension] = useState(false)

  useEffect(() => {
    if (location.protocol === "chrome-extension:")
      setExtension(true)
  }, [])

  if (extension)
    return <main className="h-[600px] w-[400px] p-4">
      {children}
    </main>

  return <main className="h-full w-full m-auto max-w-3xl p-4">
    {children}
  </main>
}
