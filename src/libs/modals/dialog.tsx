import { Outline } from "../icons/icons"
import { Events, useKeyboardEscape, useMouse } from "../react/events"
import { ChildrenProps } from "../react/props/children"
import { CloseProps } from "../react/props/close"
import { Modal } from "./modal"

export function DialogTitle(props: ChildrenProps & CloseProps) {
  const { children, close } = props

  return <h1 className="flex items-center">
    <div className="text-xl font-medium">
      {children}
    </div>
    <div className="grow" />
    <button className="group icon-md flex justify-center items-center rounded-full bg-low-contrast ahover:scale-105 transition-transform"
      onClick={close}>
      <Outline.XMarkIcon className="icon-xs text-contrast group-enabled:group-active:scale-90 transition-transform" />
    </button>
  </h1>
}

export function Dialog(props: ChildrenProps & CloseProps) {
  const { children, close } = props

  const onClose = useMouse<HTMLDivElement>(e => {
    if (e.clientX < e.currentTarget.clientWidth) close()
  }, [close])

  const onEscape = useKeyboardEscape(close)

  return <Modal type="div">
    <div className="p-safe fixed inset-0 z-10 flex flex-col bg-backdrop animate-opacity"
      onMouseDown={onClose}
      onClick={Events.keep}>
      <div className="grow" />
      <div className="p-2">
        <aside className="w-full mx-auto min-w-0 max-w-2xl rounded-xl animate-slideup bg-default"
          onMouseDown={Events.keep}
          onKeyDown={onEscape}>
          <div className="p-xmd">
            {children}
          </div>
        </aside>
      </div>
      <div className="hidden md:block grow" />
    </div>
  </Modal>
}
