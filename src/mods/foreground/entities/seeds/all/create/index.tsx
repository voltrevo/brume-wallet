import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { usePathContext } from "@/mods/foreground/router/path/context";
import { MouseEvent, useCallback } from "react";
import { useGenius } from "../../../users/all/page";
import { WideShrinkableNakedMenuAnchor, WideShrinkableNakedMenuButton } from "../../../wallets/actions/send";

export function SeedCreatorMenu(props: {}) {
  const path = usePathContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const mnemonic = useGenius(path, "/create/mnemonic")
  const hardware = useGenius(path, "/create/hardware")

  const onHardwareClick = useCallback((e: MouseEvent) => Errors.runAndLogAndAlert(async () => {
    if (location.pathname !== "/" && location.pathname !== "/index.html") {
      await background.tryRequest({
        method: "brume_open",
        params: [location.pathname]
      }).then(r => r.unwrap().unwrap())

      return
    }

    hardware.onClick(e)
  }), [background, hardware])

  return <div className="flex flex-col text-left gap-2">
    <WideShrinkableNakedMenuAnchor
      onClick={mnemonic.onClick}
      onKeyDown={mnemonic.onKeyDown}
      href={mnemonic.href}>
      <Outline.DocumentTextIcon className="size-4" />
      Mnemonic
    </WideShrinkableNakedMenuAnchor>
    <WideShrinkableNakedMenuButton
      onClick={onHardwareClick}>
      <Outline.SwatchIcon className="size-4" />
      Hardware
    </WideShrinkableNakedMenuButton>
  </div>
}
