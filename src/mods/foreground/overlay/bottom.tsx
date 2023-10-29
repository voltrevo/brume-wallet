import { Outline } from "@/libs/icons/icons";
import { Button } from "@/libs/ui/button";
import { useCallback } from "react";
import { useAppRequests } from "../entities/requests/all/data";
import { Path, usePath } from "../router/path/context";

export function Bottom() {
  const path = usePath()

  const onWalletsClick = useCallback(() => {
    Path.go("/wallets")
  }, [])

  const onSeedsClick = useCallback(() => {
    Path.go("/seeds")
  }, [])

  const onSessionsClick = useCallback(() => {
    Path.go("/sessions")
  }, [])

  const requestsQuery = useAppRequests()
  const requests = requestsQuery.data?.inner

  const onRequestsClick = useCallback(() => {
    Path.go("/requests")
  }, [])

  const onSettingsClick = useCallback(() => {
    Path.go("/settings")
  }, [])

  return <nav className="h-16 w-full shrink-0 border-t border-t-contrast">
    <div className="w-full h-16 px-4 m-auto max-w-3xl flex items-center">
      <Button.Base className="grow text-contrast aria-selected:text-default"
        aria-selected={path.pathname === "/" || path.pathname === "/wallets"}
        onClick={onWalletsClick}>
        <Button.Shrinker>
          <Outline.WalletIcon className="s-md" />
        </Button.Shrinker>
      </Button.Base>
      <Button.Base className="grow text-contrast aria-selected:text-default"
        aria-selected={path.pathname === "/seeds"}
        onClick={onSeedsClick}>
        <Button.Shrinker>
          <Outline.SparklesIcon className="s-md" />
        </Button.Shrinker>
      </Button.Base>
      <Button.Base className="grow text-contrast aria-selected:text-default"
        aria-selected={path.pathname === "/sessions"}
        onClick={onSessionsClick}>
        <Button.Shrinker>
          <Outline.GlobeAltIcon className="s-md" />
        </Button.Shrinker>
      </Button.Base>
      <Button.Base className="grow text-contrast aria-selected:text-default"
        aria-selected={path.pathname === "/requests"}
        onClick={onRequestsClick}>
        <Button.Shrinker className="">
          <div className="relative">
            {Boolean(requests?.length) &&
              <div className="absolute top-0 -right-2 bg-purple-400 rounded-full w-2 h-2" />}
            <Outline.CheckIcon className="s-md" />
          </div>
        </Button.Shrinker>
      </Button.Base>
      <Button.Base className="grow text-contrast aria-selected:text-default"
        aria-selected={path.pathname === "/settings"}
        onClick={onSettingsClick}>
        <Button.Shrinker>
          <Outline.CogIcon className="s-md" />
        </Button.Shrinker>
      </Button.Base>
    </div>
  </nav>
}