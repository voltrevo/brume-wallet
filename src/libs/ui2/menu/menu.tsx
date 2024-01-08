import { Events, useKeyboardEscape, useMouse } from "@/libs/react/events"
import { ChildrenProps } from "@/libs/react/props/children"
import { CloseProps } from "@/libs/react/props/close"
import { DarkProps } from "@/libs/react/props/dark"
import { ButtonProps } from "@/libs/react/props/html"
import { Portal } from "@/libs/ui/portal/portal"
import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { flushSync } from "react-dom"

export interface Position {
  readonly x: number
  readonly y: number
}

export interface PositionProps {
  readonly position?: Position
}

export function Menu(props: PositionProps & CloseProps & ChildrenProps & DarkProps) {
  const { position, close, dark, children } = props

  const opened = position != null

  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)
  const [menu, setMenu] = useState<HTMLElement | null>(null)

  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)

  useEffect(() => {
    if (position == null)
      return
    if (menu == null)
      return
    setLeft(Math.min(position.x + menu.offsetWidth, window.innerWidth) - menu.offsetWidth)
    setTop(Math.min(position.y + menu.offsetHeight, window.innerHeight) - menu.offsetHeight)
  }, [position, menu])

  const onEscape = useKeyboardEscape(close)

  const onClickOutside = useMouse<HTMLDivElement>(e => {
    if (e.clientX > e.currentTarget.clientWidth)
      return
    close()
  }, [close])

  const [displayed, setDisplayed] = useState(opened)

  /**
   * Opened => Displayed
   */
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
   * Only unmount when transition is finished
   */
  if (!displayed)
    return null

  if (position == null)
    return null

  return <Portal type="div">
    <dialog className=""
      ref={setDialog}
      onAnimationEnd={onAnimationEnd}>
      <div className={`fixed inset-0 bg-backdrop ${opened ? "animate-opacity-in" : "animate-opacity-out"}`}
        aria-hidden="true"
        role="backdrop" />
      <div className={`fixed inset-0 ${dark ? "dark" : ""}`}
        onMouseDown={onClickOutside}
        onClick={Events.keep}>
        <aside className={`absolute flex flex-col min-w-0 max-w-xl text-default bg-default p-4 gap-4 rounded-2xl ${opened ? "animate-scale-in" : "animate-scale-out"}`}
          ref={setMenu}
          style={{ top, left }}
          role="dialog"
          aria-modal
          onMouseDown={Events.keep}
          onKeyDown={onEscape}>
          {children}
        </aside>
      </div>
    </dialog>
  </Portal>
}

export namespace Menu {

  export function SimpleButton(props: ChildrenProps & ButtonProps) {
    const { children, ...rest } = props

    return <button className="group outline-none disabled:opacity-50 transition-opacity" {...rest}>
      <div className="h-full w-full flex items-center gap-2 group-enabled:group-active:scale-90 transition-transform">
        {children}
      </div>
    </button>
  }
}