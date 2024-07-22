import { DarkProps } from "@/libs/react/props/dark"
import { CloseContext, useCloseContext, usePathContext } from "@hazae41/chemin"
import { AnimationEvent, KeyboardEvent, MouseEvent, SyntheticEvent, UIEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Events } from "../../react/events"
import { ChildrenProps } from "../../react/props/children"
import { CloseProps } from "../../react/props/close"
import { Portal } from "../portal/portal"

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

  const [premount, setPremount] = useState(true)
  const [postmount, setPostmount] = useState(false)

  /**
   * Smoothly close the dialog
   */
  const hide = useCallback((force?: boolean) => {
    if (force) {
      close()
      return
    }

    setPremount(false)
  }, [close])

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
  const onAnimationEnd = useCallback((e: AnimationEvent) => {
    flushSync(() => setPostmount(premount))

    /**
     * Prepare swipe down to close on Android
     */
    if (e.currentTarget.scrollTop === 0 && /(android)/i.test(navigator.userAgent)) {
      e.currentTarget.scrollTop = 1
      return
    }
  }, [premount])

  /**
   * Unmount this component from parent when both visible and mounted are false
   */
  useEffect(() => {
    if (premount)
      return
    if (postmount)
      return
    close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premount, postmount])

  /**
   * Set theme-color based on dark prop
   */
  useLayoutEffect(() => {
    if (!premount)
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
  }, [premount, dark])

  const touch = useRef(false)

  const onTouchStart = useCallback(() => {
    touch.current = true
  }, [])

  const onTouchEnd = useCallback(() => {
    touch.current = false
  }, [])

  const onScroll = useCallback((e: UIEvent) => {
    /**
     * Only on mobile
     */
    if (window.innerWidth > 768)
      return

    /**
     * Swipe down to close on iOS
     */
    if (e.currentTarget.scrollTop < -60) {
      hide()
      return
    }

    /**
     * Prevent swipe down to close on Android
     */
    if (!touch.current && e.currentTarget.scrollTop === 0 && /(android)/i.test(navigator.userAgent)) {
      e.currentTarget.scrollTop = 1
      return
    }

    /**
     * Swipe down to close on Android
     */
    if (touch.current && e.currentTarget.scrollTop === 0 && /(android)/i.test(navigator.userAgent)) {
      hide()
      return
    }

    /**
     * Prevent overscroll on bottom
     */
    if (e.currentTarget.scrollTop > 60) {
      e.currentTarget.classList.add("overscroll-y-none")
      return
    }

    if (e.currentTarget.scrollTop < 60) {
      e.currentTarget.classList.remove("overscroll-y-none")
      return
    }

    return
  }, [hide])

  /**
   * Only unmount when transition is finished
   */
  if (!premount && !postmount)
    return null

  return <Portal>
    <CloseContext.Provider value={hide}>
      <dialog className=""
        style={{ "--x": `${maybeX}px`, "--y": `${maybeY}px` } as any}
        onKeyDown={onEscape}
        onClose={onClose}
        ref={setDialog}>
        <div className={`fixed inset-0 bg-backdrop ${premount ? "animate-opacity-in" : "animate-opacity-out"}`}
          aria-hidden="true"
          role="backdrop" />
        <div className={`fixed inset-0 md:p-safe flex flex-col ${dark ? "dark" : ""} ${postmount && premount ? "overflow-y-scroll" : "overflow-y-hidden"} ${premount ? "animate-slideup-in md:animate-scale-xy-in" : "animate-slideup-out md:animate-scale-xy-out"}`}
          style={{ scrollbarGutter: "stable" }}
          onAnimationEnd={onAnimationEnd}
          onMouseDown={onClickOutside}
          onScroll={onScroll}
          onTouchMove={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={Events.keep}>
          <div className={`grow flex flex-col items-center w-full md:max-w-3xl md:m-auto`}>
            {hesitant &&
              <input className="h-0 -z-10 opacity-0 md:hidden"
                readOnly
                aria-hidden />}
            <div className="h-[50vh] grow md:h-8" />
            <div className={`grow flex flex-col w-full md:w-[max(min(100dvh-4rem-var(--safe-area-inset-top,env(safe-area-inset-top))-var(--safe-area-inset-bottom,env(safe-area-inset-bottom)),48rem),28rem)] md:aspect-square text-default bg-default rounded-t-3xl md:rounded-3xl`}
              aria-modal
              onMouseDown={Events.keep}>
              <div className="md:hidden p-4 flex items-center justify-center">
                <div className="w-16 h-2 bg-backdrop rounded-full" />
              </div>
              <div className="relative grow flex flex-col basis-[100dvh] md:basis-auto">
                {!hesitant &&
                  <input className="absolute h-[100dvh] -z-10 opacity-0 md:hidden"
                    readOnly
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

}