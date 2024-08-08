import { ChildrenProps } from "@/libs/react/props/children"
import { OkProps } from "@/libs/react/props/promise"
import { useCloseContext } from "@hazae41/react-close-context"
import { KeyboardEvent, MouseEvent, useCallback } from "react"

export function SelectAndClose<T extends string>(props: ChildrenProps & OkProps<T>) {
  const close = useCloseContext().unwrap()
  const { ok, children } = props

  const onClick = useCallback((e: MouseEvent) => {
    if (e.target instanceof HTMLElement === false)
      return

    const match = e.target.closest<HTMLElement>("[data-value]")

    if (match == null)
      return
    if (match.contains(e.currentTarget))
      return

    const value = match.dataset.value

    if (value == null)
      return

    ok(value as T)

    close()
  }, [ok, close])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Enter")
      return
    if (e.target instanceof HTMLElement === false)
      return

    const match = e.target.closest<HTMLElement>("[data-value]")

    if (match == null)
      return
    if (match.contains(e.currentTarget))
      return

    const value = match.dataset.value

    if (value == null)
      return

    ok(value as T)

    close()
  }, [ok, close])

  return <div className="contents"
    onKeyDown={onKeyDown}
    onClick={onClick}>
    {children}
  </div>
}