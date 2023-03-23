import { ChildrenProps } from "@/libs/react/props/children";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  const extension = typeof location !== "undefined"
    ? location.protocol === "chrome-extension:"
    : false

  if (extension)
    return <main className="h-[600px] w-[400px] p-4">
      {children}
    </main>

  return <main className="h-full w-full m-auto max-w-3xl p-4">
    {children}
  </main>
}
