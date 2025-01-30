import { Outline } from "@/libs/icons/icons"
import { ChildrenProps } from "@/libs/react/props/children"
import { ClickableOppositeAnchor } from "@/libs/ui/anchor"
import { Dialog } from "@/libs/ui/dialog"
import { Menu } from "@/libs/ui/menu"
import { PageBody } from "@/libs/ui/page/header"
import { UserCreateDialog } from "@/mods/foreground/entities/users/all/create"
import { useUserContext } from "@/mods/foreground/entities/users/context"
import { UserLoginDialog } from "@/mods/foreground/entities/users/login"
import { useLocaleContext } from "@/mods/foreground/global/mods/locale"
import { UsersMenu } from "@/mods/foreground/landing"
import { Locale } from "@/mods/foreground/locale"
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin"

export function UserGuardBody(props: ChildrenProps) {
  const maybeWrappedUser = useUserContext().getOrNull()
  const { children } = props

  console.log({ maybeWrappedUser })

  if (maybeWrappedUser == null)
    return null

  const maybeUser = maybeWrappedUser.getOrNull()

  console.log({ maybeUser })

  if (maybeUser == null)
    return <LockedBody />

  return <>{children}</>
}

export function LockedBody() {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()

  const hash = useHashSubpath(path)
  const users = useCoords(hash, "/users")

  return <PageBody>
    <HashSubpathProvider>
      {hash.url.pathname === "/users/login" &&
        <Dialog>
          <UserLoginDialog />
        </Dialog>}
      {hash.url.pathname === "/users/create" &&
        <Dialog>
          <UserCreateDialog />
        </Dialog>}
      {hash.url.pathname === "/users" &&
        <Menu>
          <UsersMenu />
        </Menu>}
    </HashSubpathProvider>
    <div className="p-4 rounded-xl border border-default-contrast border-dashed h-[200px] flex flex-col items-center justify-center">
      <ClickableOppositeAnchor
        onKeyDown={users.onKeyDown}
        onClick={users.onClick}
        href={users.href}>
        <Outline.LockOpenIcon className="size-5" />
        {Locale.get(Locale.Enter, locale)}
      </ClickableOppositeAnchor>
    </div>
  </PageBody>
}
