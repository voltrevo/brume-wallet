import { Button } from "@/libs/components/button";
import { Outline } from "@/libs/icons/icons";
import { useCallback } from "react";
import { useBackground } from "../background/context";
import { useAppRequests } from "../entities/requests/all/data";
import { Path, usePath } from "../router/path";

export function Bottom() {
  const path = usePath()
  const background = useBackground()

  const goWallets = useCallback(() => {
    Path.go("/wallets")
  }, [])

  const goSessions = useCallback(() => {
    Path.go("/sessions")
  }, [])

  const requestsQuery = useAppRequests()
  const requests = requestsQuery.data?.inner

  const goRequests = useCallback(() => {
    Path.go("/requests")
  }, [])

  return <>
    <div className="h-16" />
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-paper flex items-center">
      <Button.Naked className="grow text-contrast aria-selected:text-default"
        aria-selected={path.pathname === "/" || path.pathname === "/wallets"}
        onClick={goWallets}>
        <Button.Shrink>
          <Outline.WalletIcon className="icon-md" />
        </Button.Shrink>
      </Button.Naked>
      {background.isExtension() && <>
        <Button.Naked className="grow text-contrast aria-selected:text-default"
          aria-selected={path.pathname === "/sessions"}
          onClick={goSessions}>
          <Button.Shrink>
            <Outline.GlobeAltIcon className="icon-md" />
          </Button.Shrink>
        </Button.Naked>
        <Button.Naked className="grow text-contrast aria-selected:text-default"
          aria-selected={path.pathname === "/requests"}
          onClick={goRequests}>
          <Button.Shrink className="">
            <div className="relative">
              {Boolean(requests?.length) &&
                <div className="absolute top-0 -right-2 bg-purple-400 rounded-full s-2" />}
              <Outline.CheckIcon className="icon-md" />
            </div>
          </Button.Shrink>
        </Button.Naked>
      </>}
    </nav>
  </>
}