import { BrowserError, browser } from "@/libs/browser/browser";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { WideClickableNakedMenuAnchor } from "@/libs/ui/anchor";
import { WideClickableNakedMenuButton } from "@/libs/ui/button";
import { useCoords, usePathContext } from "@hazae41/chemin";
import { useCloseContext } from "@hazae41/react-close-context";
import { MouseEvent } from "react";

export function SeedCreatorMenu(props: {}) {
  const close = useCloseContext().getOrThrow()
  const path = usePathContext().getOrThrow()

  const mnemonic = useCoords(path, "/create/mnemonic")
  const hardware = useCoords(path, "/create/hardware")

  const openHardwareOrAlert = useAsyncUniqueCallback((e: MouseEvent) => Errors.runOrLogAndAlert(async () => {
    await BrowserError.runOrThrow(() => browser!.tabs.create({ url: `tabbed.html#/?_=${encodeURIComponent(path.go("/create/hardware").hash.slice(1))}` }))
    close()
  }), [path, close])

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuAnchor
      onClick={mnemonic.onClick}
      onKeyDown={mnemonic.onKeyDown}
      href={mnemonic.href}>
      <Outline.DocumentTextIcon className="size-4" />
      Mnemonic
    </WideClickableNakedMenuAnchor>
    {(location.pathname !== "/" && location.pathname !== "/tabbed.html") &&
      <WideClickableNakedMenuButton
        disabled={openHardwareOrAlert.loading}
        onClick={openHardwareOrAlert.run}>
        <Outline.SwatchIcon className="size-4" />
        Hardware
      </WideClickableNakedMenuButton>}
    {(location.pathname === "/" || location.pathname === "/tabbed.html") &&
      <WideClickableNakedMenuAnchor
        onClick={hardware.onClick}
        onKeyDown={hardware.onKeyDown}
        href={hardware.href}>
        <Outline.SwatchIcon className="size-4" />
        Hardware
      </WideClickableNakedMenuAnchor>}
  </div>
}
