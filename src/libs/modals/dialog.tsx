import { Events, useKeyboardEscape, useMouse } from "../react/events"
import { ChildrenProps } from "../react/props/children"
import { CloseProps } from "../react/props/close"
import { Modal } from "./modal"

export function Dialog(props: ChildrenProps & CloseProps & {
  grow?: boolean
}) {
  const { children, close, grow } = props

  const onClose = useMouse<HTMLDivElement>(e => {
    if (e.clientX < e.currentTarget.clientWidth) close()
  }, [close])

  const onEscape = useKeyboardEscape(close)

  return <Modal>
    <div className="fixed inset-0 z-10 bg-backdrop animate-opacity" />
    <div className="fixed inset-0 z-10 pt-safe px-safe flex flex-col animate-slideup md:animate-opacity-scale overflow-y-auto"
      onMouseDown={onClose}
      onClick={Events.keep}>
      <div className={`h-[4rem] shrink-0 ${grow ? "" : "grow"}`} />
      <aside className={`pb-safe md:pb-0 mx-auto w-full min-w-0 max-w-2xl rounded-t-xl md:rounded-b-xl bg-default ${grow ? "grow" : ""}`}
        onMouseDown={Events.keep}
        onKeyDown={onEscape}>
        <div className="p-xmd">
          {children}
        </div>
      </aside>
      <div className={`hidden md:block h-[4rem] shrink-0 ${grow ? "" : "grow"}`} />
    </div>
  </Modal>
}
