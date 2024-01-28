import { ChangeEvent, ClipboardEvent, DependencyList, KeyboardEvent, MouseEvent, SyntheticEvent, TouchEvent, useCallback } from "react"

export namespace Events {

  export function keep(e: SyntheticEvent<HTMLElement>) {
    e.stopPropagation()
  }

  export function noop(e: SyntheticEvent<HTMLElement>) {
    e.preventDefault()
  }

  export function cancel(e: SyntheticEvent<HTMLElement>) {
    e.preventDefault()
    e.stopPropagation()
  }

  export namespace Mouse {

    export function select(e: MouseEvent<HTMLElement>) {
      const range = document.createRange()
      range.selectNodeContents(e.currentTarget)

      const selection = window.getSelection()

      if (selection == null)
        return

      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  export namespace Keyboard {

    export function noop(e: KeyboardEvent<HTMLElement>) {
      if (e.metaKey) return
      e.preventDefault()
    }

  }

  export namespace Clipboard {

    export function reset(e: ClipboardEvent<HTMLElement>) {
      const target = e.currentTarget
      const content = target.textContent

      setTimeout(() => {
        target.textContent = content
      }, 0)
    }

  }

}

export function useSynthetic<T = HTMLElement>(
  callback: (e: SyntheticEvent<T>) => void,
  deps: DependencyList = [callback]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps)
}

export function useInputChange<T = HTMLInputElement>(
  callback: (e: ChangeEvent<T>) => void,
  deps: DependencyList = [callback]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps)
}

export function useTextAreaChange<T = HTMLTextAreaElement>(
  callback: (e: ChangeEvent<T>) => void,
  deps: DependencyList = [callback]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps)
}

/**
 * @deprecated
 * @param callback 
 * @param deps 
 * @returns 
 */
export function useMouse<T = HTMLElement>(
  callback: (e: MouseEvent<T>) => void,
  deps: DependencyList = [callback]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps)
}

export function useTouch<T = HTMLElement>(
  callback: (e: TouchEvent<T>) => void,
  deps: DependencyList = [callback]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps)
}

export function useMouseCancel<T = HTMLElement>(
  callback: (e: MouseEvent<T>) => void,
  deps: DependencyList = [callback]
) {
  return useCallback((e: MouseEvent<T>) => {
    e.preventDefault()
    e.stopPropagation()
    callback(e)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export function useKeyboard<T = HTMLElement>(
  callback: (e: KeyboardEvent<T>) => void,
  deps: DependencyList = [callback]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps)
}

export function useKeyboardEnter<T = HTMLElement>(
  callback: (e: KeyboardEvent<T>) => void,
  deps: DependencyList = [callback]
) {
  return useKeyboard((e: KeyboardEvent<T>) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    e.stopPropagation()
    callback(e)
  }, deps)
}

export function useKeyboardEscape<T = HTMLElement>(
  callback: (e: KeyboardEvent<T>) => void,
  deps: DependencyList = [callback]
) {
  return useKeyboard((e: KeyboardEvent<T>) => {
    if (e.key !== "Escape") return
    e.preventDefault()
    e.stopPropagation()
    callback(e)
  }, deps)
}