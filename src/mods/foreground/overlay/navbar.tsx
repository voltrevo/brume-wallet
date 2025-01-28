import { BrowserError, browser } from "@/libs/browser/browser"
import { Errors } from "@/libs/errors/errors"
import { Outline } from "@/libs/icons/icons"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { RoundedClickableNakedButton } from "@/libs/ui/button"
import { pathOf } from "@/libs/url/url"
import { usePathContext } from "@hazae41/chemin"

export function NavBar() {
  const path = usePathContext().getOrThrow()

  const openOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await BrowserError.runOrThrow(() => browser!.tabs.create({ url: `tabbed.html#/?_=${encodeURIComponent(pathOf(path.url))}` }))
  }), [path])

  return <div className="w-full po-2 border-b border-b-default-contrast flex items-center">
    <div className="bg-default-contrast rounded-xl po-1 grow flex items-center gap-2 min-w-0">
      <div className="grow whitespace-nowrap overflow-hidden text-ellipsis text-sm">
        <span className="text-default-contrast">
          {`brume:`}
        </span>
        <span>
          {pathOf(path.url)}
        </span>
      </div>
      <RoundedClickableNakedButton
        onClick={() => location.reload()}>
        <Outline.ArrowPathIcon className="size-4 text-default-contrast" />
      </RoundedClickableNakedButton>
      <RoundedClickableNakedButton
        onClick={openOrAlert.run}>
        <Outline.ArrowTopRightOnSquareIcon className="size-4 text-default-contrast" />
      </RoundedClickableNakedButton>
    </div>
  </div>
}