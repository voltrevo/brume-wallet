import { ChangeEvent, DependencyList, KeyboardEvent, MouseEvent, SyntheticEvent, useCallback } from "react"

export namespace Events {

  export function keep(e: SyntheticEvent<unknown>) {
    e.stopPropagation()
  }

  export function noop(e: SyntheticEvent<unknown>) {
    e.preventDefault()
  }

  export function cancel(e: SyntheticEvent<unknown>) {
    e.preventDefault()
    e.stopPropagation()
  }

}

export function useInputChange<R>(
  callback: (e: ChangeEvent<HTMLInputElement>) => R,
  deps: DependencyList = [callback]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps)
}

export function useTextAreaChange<R>(
  callback: (e: ChangeEvent<HTMLTextAreaElement>) => R,
  deps: DependencyList = [callback]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps)
}

export function useMouse<T = HTMLElement>(
  callback: (e: MouseEvent<T>) => void,
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
