import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { useObjectMemo } from "@/libs/react/memo"
import { DarkProps } from "@/libs/react/props/dark"
import { OpenedProps } from "@/libs/react/props/opened"
import { Nullable, Option } from "@hazae41/option"
import { createContext, useCallback, useContext, useLayoutEffect, useState } from "react"
import { flushSync } from "react-dom"
import { Outline } from "../../icons/icons"
import { Events, useKeyboardEscape, useMouse } from "../../react/events"
import { ChildrenProps } from "../../react/props/children"
import { CloseProps } from "../../react/props/close"
import { Button } from "../button"

export interface OpenableHandle {
  readonly opened: boolean,
  close(): void
}

export function useOpenableHandle(props: OpenedProps & CloseProps) {
  const { opened, close } = props

  return useObjectMemo({ opened, close })
}

export const DialogContext = createContext<Nullable<OpenableHandle>>(undefined)

export function useDialogContext() {
  return Option.wrap(useContext(DialogContext))
}

/**
 * Full-screen dialog
 * @param props 
 * @returns 
 */
export function Screen(props: ChildrenProps & OpenedProps & CloseProps & DarkProps) {
  const { opened, dark, children, close } = props
  const handle = useOpenableHandle(props)

  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)

  const onEscape = useKeyboardEscape(close)

  const onClose = useMouse<HTMLDivElement>(e => {
    if (e.clientX > e.currentTarget.clientWidth)
      return
    close()
  }, [close])

  const [displayed, setDisplayed] = useState(opened)

  if (opened && !displayed)
    setDisplayed(true)

  const onAnimationEnd = useCallback(() => {
    /**
     * Flush sync to avoid jitter
     */
    flushSync(() => setDisplayed(opened))
  }, [opened])

  /**
   * Show HTML dialog when displayed
   */
  useLayoutEffect(() => {
    if (!displayed)
      return
    if (!document.body.contains(dialog))
      return

    dialog?.showModal()
    return () => dialog?.close()
  }, [displayed, dialog])

  /**
   * Set theme-color based on dark prop
   */
  useLayoutEffect(() => {
    if (!displayed)
      return
    if (!dark)
      return

    const color = document.querySelector("meta[name=theme-color]")

    if (color == null)
      return

    const original = color.getAttribute("content")

    if (original == null)
      return

    color.setAttribute("content", "#000000")

    return () => color.setAttribute("content", original)
  }, [displayed, dark])

  if (!displayed)
    return null

  return <DialogContext.Provider value={handle}>
    <dialog className=""
      ref={setDialog}
      onAnimationEnd={onAnimationEnd}>
      <div className={`fixed inset-0 bg-backdrop ${opened ? "animate-opacity-in" : "animate-opacity-out"}`}
        aria-hidden="true"
        role="backdrop" />
      <div className={`fixed inset-0 flex flex-col md:p-safe ${dark ? "dark" : ""}`}
        onMouseDown={onClose}
        onClick={Events.keep}>
        <div className="hidden md:block grow" />
        <div className="flex flex-col grow md:p-2">
          <aside className={`grow flex flex-col md:grow-0 w-full mx-auto min-w-0 max-w-3xl text-default bg-default p-safe md:p-0 md:rounded-2xl ${opened ? "animate-slideup-in" : "animate-slideup-out"}`}
            role="dialog"
            aria-modal
            onMouseDown={Events.keep}
            onKeyDown={onEscape}>
            <div className="grow flex flex-col p-4">
              {children}
            </div>
          </aside>
        </div>
        <div className="hidden md:block grow" />
      </div>
    </dialog>
  </DialogContext.Provider>
}

export function Dialog(props: ChildrenProps & OpenedProps & CloseProps & DarkProps) {
  const { opened, dark, children, close } = props
  const handle = useOpenableHandle(props)

  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)

  const onEscape = useKeyboardEscape(close)

  const onClose = useMouse<HTMLDivElement>(e => {
    if (e.clientX > e.currentTarget.clientWidth)
      return
    close()
  }, [close])

  const [displayed, setDisplayed] = useState(opened)

  if (opened && !displayed)
    setDisplayed(true)

  const onAnimationEnd = useCallback(() => {
    /**
     * Flush sync to avoid jitter
     */
    flushSync(() => setDisplayed(opened))
  }, [opened])

  useLayoutEffect(() => {
    if (!displayed)
      return
    if (!document.body.contains(dialog))
      return

    dialog?.showModal()
    return () => dialog?.close()
  }, [dialog, displayed])

  if (!displayed)
    return null

  return <DialogContext.Provider value={handle}>
    <dialog className=""
      ref={setDialog}
      onAnimationEnd={onAnimationEnd}>
      <div className={`fixed inset-0 bg-backdrop ${opened ? "animate-opacity-in" : "animate-opacity-out"}`}
        aria-hidden="true"
        role="backdrop" />
      <div className={`fixed inset-0 flex flex-col p-safe ${dark ? "dark" : ""}`}
        onMouseDown={onClose}
        onClick={Events.keep}>
        <div className="grow" />
        <div className="flex flex-col p-2">
          <aside className={`flex flex-col w-full mx-auto min-w-0 max-w-3xl text-default bg-default rounded-2xl ${opened ? "animate-slideup-in" : "animate-slideup-out"}`}
            role="dialog"
            aria-modal
            onMouseDown={Events.keep}
            onKeyDown={onEscape}>
            <div className="grow flex flex-col p-4">
              {children}
            </div>
          </aside>
        </div>
        <div className="hidden md:block grow" />
      </div>
    </dialog>
  </DialogContext.Provider>
}

export namespace Dialog {

  export function Title(props: ChildrenProps & CloseProps) {
    const { children, close } = props

    return <h1 className="flex items-center">
      <div className="text-xl font-medium">
        {children}
      </div>
      <div className="grow" />
      <button className={`${Button.Base.className} size-8 hovered-or-clicked-or-focused:scale-105 !transition`}
        onClick={close}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.XMarkIcon className="size-5" />
        </div>
      </button>
    </h1>
  }

  export function Test() {
    const open = useBooleanHandle(false)

    return <div className="p-1">
      <Dialog
        opened={open.current}
        close={open.disable}>
        <Dialog.Title close={open.disable}>
          Hello world
        </Dialog.Title>
        Hello world
        <div className="h-2" />
        <div className="flex items-center gap-2">
          <Button.Base className="w-full po-md"
            onClick={open.disable}>
            <div className={`${Button.Shrinker.className}`}>
              Click me
            </div>
          </Button.Base>
          <Button.Opposite className="w-full po-md"
            onClick={open.disable}>
            <div className={`${Button.Shrinker.className}`}>
              Click me
            </div>
          </Button.Opposite>
        </div>
      </Dialog>
      <button onClick={open.enable}>
        Click me
      </button>
    </div>
  }

  export function Test2() {
    const open = useBooleanHandle(false)

    return <div className="p-1">
      <Dialog
        opened={open.current}
        close={open.disable}>
        <Dialog.Title close={open.disable}>
          Hello world
        </Dialog.Title>
        Hello world
        <div className="h-2" />
        <div className="flex items-center gap-2">
          <Button.Base className="w-full po-md"
            onClick={open.disable}>
            <div className={`${Button.Shrinker.className}`}>
              Click me
            </div>
          </Button.Base>
          <Button.Opposite className="w-full po-md"
            onClick={open.disable}>
            <div className={`${Button.Shrinker.className}`}>
              Click me
            </div>
          </Button.Opposite>
        </div>
      </Dialog>
      <button onClick={open.enable}>
        Click me
      </button>
    </div>
  }

}