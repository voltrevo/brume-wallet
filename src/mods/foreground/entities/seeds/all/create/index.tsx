import { BrowserError, browser } from "@/libs/browser/browser";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useCloseContext } from "@/libs/ui/dialog/dialog";
import { usePathContext } from "@/mods/foreground/router/path/context";
import { MouseEvent } from "react";
import { useGenius } from "../../../users/all/page";
import { WideShrinkableNakedMenuAnchor, WideShrinkableNakedMenuButton } from "../../../wallets/actions/send";

export function SeedCreatorMenu(props: {}) {
  const close = useCloseContext().unwrap()
  const path = usePathContext().unwrap()

  const mnemonic = useGenius(path, "/create/mnemonic")
  const hardware = useGenius(path, "/create/hardware")

  const openHardwareOrAlert = useAsyncUniqueCallback((e: MouseEvent) => Errors.runAndLogAndAlert(async () => {
    await BrowserError.runOrThrow(() => browser.tabs.create({ url: `index.html?_=${encodeURIComponent(path.go("/create/hardware").hash.slice(1))}` }))
    close()
  }), [path, close])

  return <div className="flex flex-col text-left gap-2">
    <WideShrinkableNakedMenuAnchor
      onClick={mnemonic.onClick}
      onKeyDown={mnemonic.onKeyDown}
      href={mnemonic.href}>
      <Outline.DocumentTextIcon className="size-4" />
      Mnemonic
    </WideShrinkableNakedMenuAnchor>
    {(location.pathname !== "/" && location.pathname !== "/index.html") &&
      <WideShrinkableNakedMenuButton
        disabled={openHardwareOrAlert.loading}
        onClick={openHardwareOrAlert.run}>
        <Outline.SwatchIcon className="size-4" />
        Hardware
      </WideShrinkableNakedMenuButton>}
    {(location.pathname === "/" || location.pathname === "/index.html") &&
      <WideShrinkableNakedMenuAnchor
        onClick={hardware.onClick}
        onKeyDown={hardware.onKeyDown}
        href={hardware.href}>
        <Outline.SwatchIcon className="size-4" />
        Hardware
      </WideShrinkableNakedMenuAnchor>}
  </div>
}
