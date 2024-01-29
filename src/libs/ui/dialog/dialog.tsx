import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { DarkProps } from "@/libs/react/props/dark"
import { usePathContext } from "@/mods/foreground/router/path/context"
import { Nullable, Option } from "@hazae41/option"
import { KeyboardEvent, MouseEvent, SyntheticEvent, UIEvent, createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Events } from "../../react/events"
import { ChildrenProps } from "../../react/props/children"
import { CloseProps } from "../../react/props/close"
import { Button } from "../button"
import { Portal } from "../portal/portal"

export const CloseContext = createContext<Nullable<() => void>>(undefined)

export function useCloseContext() {
  return Option.wrap(useContext(CloseContext))
}

export function Dialog2(props: ChildrenProps & DarkProps & { hesitant?: boolean }) {
  const close = useCloseContext().unwrap()
  const { dark, children, hesitant } = props

  return <Dialog
    hesitant={hesitant}
    close={close}
    dark={dark}>
    {children}
  </Dialog>
}

export function Dialog(props: ChildrenProps & CloseProps & DarkProps & { hesitant?: boolean }) {
  const { url } = usePathContext().unwrap()
  const { dark, children, close, hesitant } = props

  const maybeX = url.searchParams.get("x")
  const maybeY = url.searchParams.get("y")

  const previous = useRef(document.activeElement)

  /**
   * Restore focus on unmount
   */
  useEffect(() => () => {
    if (previous.current == null)
      return
    if (!(previous.current instanceof HTMLElement))
      return
    previous.current.focus()
  }, [])

  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)

  /**
   * Forcefully open HTML dialog on mount
   */
  useLayoutEffect(() => {
    if (!document.body.contains(dialog))
      return
    dialog?.showModal()
  }, [dialog])

  /**
   * Pre-animation state
   */
  const [visible, setVisible] = useState(true)

  /**
   * Post-animation state
   */
  const [mounted, setMounted] = useState(false)

  /**
   * Smoothly close the dialog
   */
  const hide = useCallback(() => {
    setVisible(false)
  }, [])

  /**
   * Smoothly close the dialog on escape
   */
  const onEscape = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Escape")
      return

    e.preventDefault()

    hide()
  }, [hide])

  /**
   * Smoothly close the dialog on outside click
   */
  const onClickOutside = useCallback((e: MouseEvent) => {
    if (e.clientX > e.currentTarget.clientWidth)
      return

    e.preventDefault()

    hide()
  }, [hide])


  /**
   * When the dialog could not be closed smoothly
   * @example Safari on escape
   */
  const onClose = useCallback((e: SyntheticEvent) => {
    close()
  }, [close])

  /**
   * Sync mounted state with visible state on animation end
   */
  const onAnimationEnd = useCallback(() => {
    flushSync(() => setMounted(visible))
  }, [visible])

  /**
   * Unmount this component from parent when both visible and mounted are false
   */
  useEffect(() => {
    if (visible)
      return
    if (mounted)
      return
    close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mounted])

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

  const onScroll = useCallback((e: UIEvent) => {
    /**
     * Only on mobile
     */
    if (window.innerWidth > 768)
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
  }, [hide])

  /**
   * Only unmount when transition is finished
   */
  if (!visible && !mounted)
    return null

  return <Portal type="div">
    <CloseContext.Provider value={hide}>
      <dialog className=""
        style={{ "--x": `${maybeX}px`, "--y": `${maybeY}px` } as any}
        onKeyDown={onEscape}
        onClose={onClose}
        ref={setDialog}>
        <div className={`fixed inset-0 bg-backdrop ${visible ? "animate-opacity-in" : "animate-opacity-out"}`}
          aria-hidden="true"
          role="backdrop" />
        <div className={`fixed inset-0 md:p-safe flex flex-col ${dark ? "dark" : ""} ${mounted && visible ? "overflow-y-scroll" : "overflow-y-hidden"} ${visible ? "animate-slideup-in md:animate-scale-xy-in" : "animate-slideup-out md:animate-scale-xy-out"}`}
          style={{ scrollbarGutter: "stable" }}
          onAnimationEnd={onAnimationEnd}
          onMouseDown={onClickOutside}
          onScroll={onScroll}
          onClick={Events.keep}>
          <div className={`grow flex flex-col items-center w-full md:max-w-3xl md:m-auto`}>
            {hesitant &&
              <input className="h-0 -z-10 opacity-0 md:hidden"
                aria-hidden />}
            <div className="h-[50vh] grow md:h-8" />
            <div className={`grow flex flex-col w-full md:aspect-square text-default bg-default rounded-t-3xl md:rounded-3xl`}
              aria-modal
              onMouseDown={Events.keep}>
              <div className="md:hidden p-4 flex items-center justify-center">
                <div className="w-16 h-2 bg-backdrop rounded-full" />
              </div>
              <div className="relative grow flex flex-col basis-[100dvh] md:basis-0">
                {!hesitant &&
                  <input className="absolute h-[100dvh] -z-10 opacity-0 md:hidden"
                    aria-hidden />}
                <div className="grow flex flex-col p-6">
                  <div className="grow flex flex-col p-safe md:p-0">
                    {children}
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:block md:grow md:h-8" />
          </div>
        </div>
      </dialog>
    </CloseContext.Provider>
  </Portal>
}

export namespace Dialog {

  export function Title(props: ChildrenProps) {
    const { children } = props

    return <h1 className="flex items-center">
      <div className="text-2xl font-medium">
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
          <Dialog.Title>
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
          <Dialog.Title>
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