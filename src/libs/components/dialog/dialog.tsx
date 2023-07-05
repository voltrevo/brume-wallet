import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { Outline } from "../../icons/icons"
import { Events, useKeyboardEscape, useMouse } from "../../react/events"
import { ChildrenProps } from "../../react/props/children"
import { CloseProps } from "../../react/props/close"
import { Button } from "../button"
import { Portal } from "../portal/portal"

export function Dialog(props: ChildrenProps & CloseProps) {
  const { children, close } = props

  const onClose = useMouse<HTMLDivElement>(e => {
    if (e.clientX < e.currentTarget.clientWidth) close()
  }, [close])

  const onEscape = useKeyboardEscape(close)

  return <Portal type="div">
    <div className="fixed inset-0 z-10">
      <div className="p-safe fixed inset-0 z-10 flex flex-col bg-backdrop animate-opacity"
        onMouseDown={onClose}
        onClick={Events.keep}>
        <div className="grow" />
        <div className="p-2">
          <aside className="w-full mx-auto min-w-0 max-w-2xl rounded-2xl animate-slideup bg-default"
            onMouseDown={Events.keep}
            onKeyDown={onEscape}>
            <div className="p-xmd">
              {children}
            </div>
          </aside>
        </div>
        <div className="hidden md:block grow" />
      </div>
    </div>
  </Portal>
}

export namespace Dialog {

  export function Title(props: ChildrenProps & CloseProps) {
    const { children, close } = props

    return <h1 className="flex items-center">
      <div className="text-xl font-medium">
        {children}
      </div>
      <div className="grow" />
      <Button.Naked className="icon-xl hovered-or-clicked:scale-105 transition"
        onClick={close}>
        <Button.Shrink>
          <Outline.XMarkIcon className="icon-sm" />
        </Button.Shrink>
      </Button.Naked>
    </h1>
  }

  export function Test() {
    const open = useBooleanHandle(false)

    return <div className="p-1">
      {open.current &&
        <Dialog close={open.disable}>
          <Dialog.Title close={open.disable}>
            Hello world
          </Dialog.Title>
          Hello world
          <div className="h-2" />
          <div className="flex items-center gap-2">
            <Button.Naked className="w-full p-md"
              onClick={open.disable}>
              <Button.Shrink>
                Click me
              </Button.Shrink>
            </Button.Naked>
            <Button.Opposite className="w-full p-md"
              onClick={open.disable}>
              <Button.Shrink>
                Click me
              </Button.Shrink>
            </Button.Opposite>
          </div>
        </Dialog>}
      <button onClick={open.enable}>
        Click me
      </button>
    </div>
  }

}