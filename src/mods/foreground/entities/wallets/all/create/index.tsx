import { Outline } from "@/libs/icons/icons";
import { usePathContext } from "@/mods/foreground/router/path/context";
import { useGenius } from "../../../users/all/page";
import { WideShrinkableNakedMenuAnchor } from "../../actions/send";

export function WalletCreatorMenu(props: {}) {
  const path = usePathContext().unwrap()

  const readonly = useGenius(path, "/readonly")
  const standalone = useGenius(path, "/standalone")

  return <div className="flex flex-col text-left gap-2">
    <WideShrinkableNakedMenuAnchor
      onClick={standalone.onClick}
      onKeyDown={standalone.onKeyDown}
      href={standalone.href}>
      <Outline.WalletIcon className="size-4" />
      Standalone
    </WideShrinkableNakedMenuAnchor>
    <WideShrinkableNakedMenuAnchor
      onClick={readonly.onClick}
      onKeyDown={readonly.onKeyDown}
      href={readonly.href}>
      <Outline.EyeIcon className="size-4" />
      Watch-only
    </WideShrinkableNakedMenuAnchor>
  </div>
}
