import { Outline } from "@/libs/icons/icons";
import { Button } from "@/libs/ui/button";
import { useCallback } from "react";
import { useBackground } from "../background/context";
import { useAppRequests } from "../entities/requests/all/data";
import { Path, usePath } from "../router/path";

export function Bottom() {
  const path = usePath()
  const background = useBackground().unwrap()

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

  return <>
    <div className="pb-safe h-16" />
    <nav className="pb-safe fixed bottom-0 left-0 w-full bg-default">
      <div className="w-full h-16 px-4 m-auto max-w-3xl flex items-center">
        <Button.Naked className="grow text-contrast aria-selected:text-default"
          aria-selected={path.pathname === "/" || path.pathname === "/wallets"}
          onClick={onWalletsClick}>
          <Button.Shrink>
            <Outline.WalletIcon className="s-md" />
          </Button.Shrink>
        </Button.Naked>
        <Button.Naked className="grow text-contrast aria-selected:text-default"
          aria-selected={path.pathname === "/seeds"}
          onClick={onSeedsClick}>
          <Button.Shrink>
            <Outline.SparklesIcon className="s-md" />
          </Button.Shrink>
        </Button.Naked>
        {background.isExtension() && <>
          <Button.Naked className="grow text-contrast aria-selected:text-default"
            aria-selected={path.pathname === "/sessions"}
            onClick={onSessionsClick}>
            <Button.Shrink>
              <Outline.GlobeAltIcon className="s-md" />
            </Button.Shrink>
          </Button.Naked>
          <Button.Naked className="grow text-contrast aria-selected:text-default"
            aria-selected={path.pathname === "/requests"}
            onClick={onRequestsClick}>
            <Button.Shrink className="">
              <div className="relative">
                {Boolean(requests?.length) &&
                  <div className="absolute top-0 -right-2 bg-purple-400 rounded-full w-2 h-2" />}
                <Outline.CheckIcon className="s-md" />
              </div>
            </Button.Shrink>
          </Button.Naked>
        </>}
      </div>
    </nav>
  </>
}