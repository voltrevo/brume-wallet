import { Outline } from "@/libs/icons/icons";
import { WideClickableNakedMenuAnchor } from "@/libs/ui/anchor";
import { useCoords, usePathContext } from "@hazae41/chemin";

export function WalletCreatorMenu(props: {}) {
  const path = usePathContext().getOrThrow()

  const readonly = useCoords(path, "/create/readonly")
  const standalone = useCoords(path, "/create/standalone")

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuAnchor
      onClick={standalone.onClick}
      onKeyDown={standalone.onKeyDown}
      href={standalone.href}>
      <Outline.WalletIcon className="size-4" />
      Standalone
    </WideClickableNakedMenuAnchor>
    <WideClickableNakedMenuAnchor
      onClick={readonly.onClick}
      onKeyDown={readonly.onKeyDown}
      href={readonly.href}>
      <Outline.EyeIcon className="size-4" />
      Watch-only
    </WideClickableNakedMenuAnchor>
  </div>
}
