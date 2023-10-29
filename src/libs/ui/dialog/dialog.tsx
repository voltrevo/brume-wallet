import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { useObjectMemo } from "@/libs/react/memo"
import { OpenedProps } from "@/libs/react/props/opened"
import { Nullable, Option } from "@hazae41/option"
import { createContext, useCallback, useContext, useState } from "react"
import { flushSync } from "react-dom"
import { Outline } from "../../icons/icons"
import { Events, useKeyboardEscape, useMouse } from "../../react/events"
import { ChildrenProps } from "../../react/props/children"
import { CloseProps } from "../../react/props/close"
import { Button } from "../button"
import { Portal } from "../portal/portal"

export interface DialogHandle {
  readonly opened: boolean,
  close(): void
}

export function useDialogHandle(props: OpenedProps & CloseProps) {
  const { opened, close } = props

  return useObjectMemo({ opened, close })
}

export const DialogContext = createContext<Nullable<DialogHandle>>(undefined)

export function useDialogContext() {
  return Option.wrap(useContext(DialogContext))
}

export function Dialog(props: ChildrenProps & OpenedProps & CloseProps) {
  const { opened, children, close } = props
  const handle = useDialogHandle(props)

  const onEscape = useKeyboardEscape(close)

  const onClose = useMouse<HTMLDivElement>(e => {
    if (e.clientX < e.currentTarget.clientWidth) close()
  }, [close])

  const [displayed, setDisplayed] = useState(opened)

  if (opened && !displayed)
    setDisplayed(true)

  const onAnimationEnd = useCallback(() => {
    flushSync(() => setDisplayed(opened))
  }, [opened])

  if (!displayed)
    return null

  return <DialogContext.Provider value={handle}>
    <Portal type="div">
      <div className="fixed inset-0 z-10">
        <div className={`p-safe fixed inset-0 z-10 flex flex-col bg-backdrop ${opened ? "animate-opacity-in" : "animate-opacity-out"}`}
          onMouseDown={onClose}
          onClick={Events.keep}
          onAnimationEnd={onAnimationEnd}>
          <div className="grow" />
          <div className="p-2">
            <aside className={`w-full mx-auto min-w-0 max-w-2xl rounded-2xl ${opened ? "animate-slideup-in" : "animate-slideup-out"} bg-default`}
              onMouseDown={Events.keep}
              onKeyDown={onEscape}>
              <div className="p-4">
                {opened && children}
              </div>
            </aside>
          </div>
          <div className="hidden md:block grow" />
        </div>
      </div>
    </Portal>
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
      <Button.Base className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
        onClick={close}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.XMarkIcon className="s-sm" />
        </div>
      </Button.Base>
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

}