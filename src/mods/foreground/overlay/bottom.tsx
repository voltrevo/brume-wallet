import { Outline } from "@/libs/icons/icons";
import { Anchor } from "@/libs/ui/anchor";
import { useAppRequests } from "../entities/requests/all/data";
import { usePathContext } from "../router/path/context";

export function Bottom() {
  const path = usePathContext()

  const requestsQuery = useAppRequests()
  const requests = requestsQuery.data?.inner

  return <nav className="h-16 w-full shrink-0 border-t border-t-contrast">
    <div className="w-full h-16 px-4 m-auto max-w-3xl flex items-center">
      <a className={`group grow text-contrast data-[selected=true]:text-default`}
        data-selected={path.pathname === "/" || path.pathname === "/wallets"}
        href="#/wallets">
        <div className={`${Anchor.Shrinker.className}`}>
          <Outline.WalletIcon className="s-md" />
        </div>
      </a>
      <a className={`group grow text-contrast data-[selected=true]:text-default`}
        data-selected={path.pathname === "/seeds"}
        href="#/seeds">
        <div className={`${Anchor.Shrinker.className}`}>
          <Outline.SparklesIcon className="s-md" />
        </div>
      </a>
      <a className="group grow text-contrast data-[selected=true]:text-default"
        data-selected={path.pathname === "/sessions"}
        href="#/sessions">
        <div className={`${Anchor.Shrinker.className}`}>
          <Outline.GlobeAltIcon className="s-md" />
        </div>
      </a>
      <a className="group grow text-contrast data-[selected=true]:text-default"
        data-selected={path.pathname === "/requests"}
        href="#/requests">
        <div className={`${Anchor.Shrinker.className}`}>
          <div className="relative">
            {Boolean(requests?.length) &&
              <div className="absolute top-0 -right-2">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-purple-400" />
                </span>
              </div>}
            <Outline.CheckIcon className="s-md" />
          </div>
        </div>
      </a>
      <a className="group grow text-contrast data-[selected=true]:text-default"
        data-selected={path.pathname === "/settings"}
        href="#/settings">
        <div className={`${Anchor.Shrinker.className}`}>
          <Outline.CogIcon className="s-md" />
        </div>
      </a>
    </div>
  </nav>
}