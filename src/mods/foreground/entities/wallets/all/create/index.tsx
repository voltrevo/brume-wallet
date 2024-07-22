import { Outline } from "@/libs/icons/icons";
import { usePathContext } from "@hazae41/chemin";
import { useGenius } from "../../../users/all/page";
import { WideShrinkableNakedMenuAnchor } from "../../actions/send";

export function WalletCreatorMenu(props: {}) {
  const path = usePathContext().unwrap()

  const readonly = useGenius(path, "/create/readonly")
  const standalone = useGenius(path, "/create/standalone")

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
