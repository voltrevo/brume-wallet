import { Button } from "@/libs/components/button";
import { Outline } from "@/libs/icons/icons";
import { useCallback } from "react";
import { useBackground } from "../background/context";
import { Path, usePath } from "../router/path";

export function Bottom() {
  const path = usePath()
  const background = useBackground()

  const wallets = useCallback(() => {
    Path.go("/wallets")
  }, [])

  const sessions = useCallback(() => {
    Path.go("/sessions")
  }, [])

  return <>
    <div className="h-16" />
    <nav className="fixed bottom-0 w-full h-16 bg-paper flex items-center">
      <Button.Naked className="grow text-contrast aria-selected:text-default"
        aria-selected={path.pathname === "/" || path.pathname === "/wallets"}
        onClick={wallets}>
        <Button.Shrink>
          <Outline.WalletIcon className="icon-md" />
        </Button.Shrink>
      </Button.Naked>
      {background.isExtension() &&
        <Button.Naked className="grow text-contrast aria-selected:text-default"
          aria-selected={path.pathname === "/sessions"}
          onClick={sessions}>
          <Button.Shrink>
            <Outline.GlobeAltIcon className="icon-md" />
          </Button.Shrink>
        </Button.Naked>}
    </nav>
  </>
}