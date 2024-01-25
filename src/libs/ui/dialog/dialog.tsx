import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { DarkProps } from "@/libs/react/props/dark"
import { usePathContext } from "@/mods/foreground/router/path/context"
import { Nullable, Option } from "@hazae41/option"
import { UIEvent, createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react"
import { flushSync } from "react-dom"
import { Events, useKeyboardEscape, useMouse } from "../../react/events"
import { ChildrenProps } from "../../react/props/children"
import { CloseProps } from "../../react/props/close"
import { Button } from "../button"
import { Portal } from "../portal/portal"

export const CloseContext = createContext<Nullable<() => void>>(undefined)

export function useCloseContext() {
  return Option.wrap(useContext(CloseContext))
}

export function Dialog(props: ChildrenProps & CloseProps & DarkProps) {
  const { url } = usePathContext().unwrap()
  const { dark, children, close } = props

  const x = url.searchParams.get("x")
  const y = url.searchParams.get("y")

  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  const hide = useCallback(() => {
    setVisible(false)
  }, [])

  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)

  const onEscape = useKeyboardEscape(hide)

  const onClickOutside = useMouse<HTMLDivElement>(e => {
    if (e.clientX > e.currentTarget.clientWidth)
      return
    hide()
  }, [hide])

  const onAnimationEnd = useCallback(() => {
    flushSync(() => setMounted(visible))
  }, [visible])

  useEffect(() => {
    if (visible)
      return
    if (mounted)
      return
    close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mounted])

  /**
   * Show HTML dialog when displayed
   */
  useLayoutEffect(() => {
    if (!document.body.contains(dialog))
      return

    dialog?.showModal()
    return () => dialog?.close()
  }, [dialog])

  /**
   * Set theme-color based on dark prop
   */
  useLayoutEffect(() => {
    if (!visible)
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
  }, [visible, dark])

  const [viewportWidth, setViewportWidth] = useState(() => Math.max(document.documentElement.clientWidth, window.innerWidth))

  useEffect(() => {
    const onResize = () => setViewportWidth(Math.max(document.documentElement.clientWidth, window.innerWidth))

    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    /**
     * Only on mobile
     */
    if (viewportWidth > 768)
      return

    /**
     * Swipe down to close
     */
    if (e.currentTarget.scrollTop < -60) {
      hide()
      return
    }

    /**
     * Prevent overscroll on bottom
     */
    if (e.currentTarget.scrollTop > 60)
      e.currentTarget.classList.add("overscroll-y-none")
    else
      e.currentTarget.classList.remove("overscroll-y-none")

    return
  }, [hide, viewportWidth])

  /**
   * Only unmount when transition is finished
   */
  if (!visible && !mounted)
    return null

  return <Portal type="div">
    <CloseContext.Provider value={hide}>
      <dialog className=""
        style={{ "--x": `${x}px`, "--y": `${y}px` } as any}
        onKeyDown={onEscape}
        ref={setDialog}>
        <div className={`fixed inset-0 bg-backdrop ${visible ? "animate-opacity-in" : "animate-opacity-out"}`}
          aria-hidden="true"
          role="backdrop" />
        <div className={`fixed inset-0 pt-safe md:p-safe flex flex-col ${dark ? "dark" : ""} ${mounted && visible ? "overflow-y-scroll" : "overflow-y-hidden"} ${visible ? "animate-slideup-in md:animate-scale-xy-in" : "animate-slideup-out md:animate-scale-xy-out"}`}
          style={{ scrollbarGutter: "stable" }}
          onAnimationEnd={onAnimationEnd}
          onMouseDown={onClickOutside}
          onScroll={onScroll}
          onClick={Events.keep}>
          <div className={`grow flex flex-col items-center`}>
            <div className="h-[50vh] grow md:h-8" />
            <aside className={`flex flex-col w-full md:w-[min(90dvh,90dvw)] md:aspect-square text-default bg-default rounded-t-3xl md:rounded-3xl`}
              role="dialog"
              aria-modal
              onMouseDown={Events.keep}>
              <div className="grow flex flex-col bg-contrast rounded-t-3xl md:rounded-3xl">
                <div className="md:hidden p-4 flex items-center justify-center">
                  <div className="w-16 h-2 bg-backdrop rounded-full" />
                </div>
                <div className="grow flex flex-col p-6 basis-[100dvh] md:basis-0">
                  {children}
                </div>
              </div>
            </aside>
            <div className="hidden md:block md:grow md:h-8" />
          </div>
        </div>
      </dialog>
    </CloseContext.Provider>
  </Portal>
}

export namespace Dialog {

  export function Title(props: ChildrenProps & CloseProps) {
    const { children } = props

    return <h1 className="flex items-center">
      <div className="text-xl font-medium">
        {children}
      </div>
    </h1>
  }

  export function Test() {
    const open = useBooleanHandle(false)

    return <div className="p-1">
      {open.current &&
        <Dialog
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
        </Dialog>}
      <button onClick={open.enable}>
        Click me
      </button>
    </div>
  }

  export function Test2() {
    const open = useBooleanHandle(false)

    return <div className="p-1">
      {open.current &&
        <Dialog
          close={open.disable}>
          <Dialog.Title close={open.disable}>
            Hello world
          </Dialog.Title>
          Hello world
          <div className="h-2" />
          <div className="flex items-center gap-2">
            <button className="w-full po-md"
              onClick={open.disable}>
              <div className={`${Button.Shrinker.className}`}>
                Click me
              </div>
            </button>
            <button className="w-full po-md"
              onClick={open.disable}>
              <div className={`${Button.Shrinker.className}`}>
                Click me
              </div>
            </button>
          </div>
        </Dialog>}
      <button onClick={open.enable}>
        Click me
      </button>
    </div>
  }

}