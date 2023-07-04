import { useLazyMemo } from "@/libs/react/memo"
import { ChildrenProps } from "@/libs/react/props/children"
import { createContext, useContext, useEffect } from "react"
import { createPortal } from "react-dom"
import { ElementTypeProps } from "../react/props/element"

export const ModalContext =
  createContext<number>(0)

export function Modal(props: ElementTypeProps & ChildrenProps) {
  const { type, children } = props
  const number = useContext(ModalContext)

  const element = useLazyMemo(() =>
    document.createElement(type), [])

  useEffect(() => {
    if (!element) return
    document.getElementById("__next")?.appendChild(element)
    return () => void document.getElementById("__next")?.removeChild(element)
  }, [element])

  if (element == null)
    return null

  return <ModalContext.Provider value={number + 1}>
    {createPortal(children, element)}
  </ModalContext.Provider>
}