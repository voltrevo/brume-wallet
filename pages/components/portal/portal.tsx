import { useLazyMemo } from "@/libs/react/memo"
import { ChildrenProps } from "@/libs/react/props/children"
import { OptionalElementProps } from "@/libs/react/props/element"
import { createContext, useContext, useEffect } from "react"
import { createPortal } from "react-dom"
import { TypeProps } from "../../../src/libs/react/props/type"

export default function Page() {
  return <div className="p-1">
    <Portal type="div" container={document.getElementById("__next")}>
      Hello world
    </Portal>
    <div className="">
      Hello world
    </div>
  </div>
}

export const PortalContext =
  createContext<number>(0)

export function usePortalContext() {
  return useContext(PortalContext)
}

export function Portal(props: TypeProps & ChildrenProps & OptionalElementProps<"container">) {
  const {
    children,
    type = "div",
    container = document.getElementById("__next")
  } = props

  const number = usePortalContext()

  const element = useLazyMemo(() => document.createElement(type), [])

  useEffect(() => {
    if (element == null)
      return
    if (container == null)
      return

    container.appendChild(element)

    return () => void container.removeChild(element)
  }, [element, container])

  if (element == null)
    return null

  return <PortalContext.Provider value={number + 1}>
    {createPortal(children, element)}
  </PortalContext.Provider>
}