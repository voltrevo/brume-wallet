import { Objects } from "@/libs/objects/objects"
import { ChildrenProps } from "@/libs/react/props/children"
import { PathnameProps } from "@/libs/react/props/pathname"
import { OkProps } from "@/libs/react/props/promise"
import { ValueProps } from "@/libs/react/props/value"
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin"
import { useCloseContext } from "@hazae41/react-close-context"
import { Fragment, KeyboardEvent, MouseEvent, useCallback } from "react"
import { WideClickableNakedMenuButton } from "../button"
import { Menu } from "../menu"

export function HashSelector<T extends string>(props: PathnameProps & ValueProps<T> & OkProps<T> & ChildrenProps<Record<T, string>>) {
  const path = usePathContext().getOrThrow()
  const hash = useHashSubpath(path)

  const { pathname, value, ok, children } = props

  const coords = useCoords(hash, pathname)

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === pathname &&
        <Menu>
          <SelectAndClose ok={ok}>
            <div className="flex flex-col text-left gap-2">
              {children != null && Objects.entries(children).map(([code, name]) =>
                <Fragment key={code}>
                  <WideClickableNakedMenuButton
                    aria-selected={value === code}
                    data-value={code}>
                    <div className="truncate">
                      {name}
                    </div>
                  </WideClickableNakedMenuButton>
                </Fragment>)}
            </div>
          </SelectAndClose>
        </Menu>}
    </HashSubpathProvider>
    {children != null && children[value] != null &&
      <a className="truncate"
        onClick={coords.onClick}
        onKeyDown={coords.onKeyDown}
        href={coords.href}>
        {children[value]}
      </a>}
  </>
}

export function SelectAndClose<T extends string>(props: ChildrenProps & OkProps<T>) {
  const close = useCloseContext().getOrThrow()
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