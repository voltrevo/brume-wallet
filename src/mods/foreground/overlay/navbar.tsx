import { BrowserError, browser } from "@/libs/browser/browser"
import { Errors } from "@/libs/errors/errors"
import { Outline } from "@/libs/icons/icons"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { Button } from "@/libs/ui/button"
import { usePathContext } from "../router/path/context"

export function NavBar() {
  const { url } = usePathContext().unwrap()

  const openOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await BrowserError.runOrThrow(() => browser.tabs.create({ url: `index.html#${url.pathname}` }))
  }), [url])

  return <div className="w-full po-md border-b border-b-contrast">
    <div className="w-full max-w-[400px] m-auto flex items-center">
      <div className="bg-contrast rounded-xl po-sm grow flex items-center min-w-0">
        <div className="grow whitespace-nowrap overflow-hidden text-ellipsis text-sm">
          <span className="text-contrast">
            {`brume://`}
          </span>
          <span>
            {url.pathname.slice(1)}
          </span>
        </div>
        <div className="w-2" />
        <Button.Base className="text-contrast hovered-or-clicked-or-focused:scale-105 !transition"
          onClick={openOrAlert.run}>
          <div className={`${Button.Shrinker.className}`}>
            <Outline.ArrowTopRightOnSquareIcon className="size-4" />
          </div>
        </Button.Base>
      </div>
    </div>
  </div>
}