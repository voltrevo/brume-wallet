import { Outline } from "@/libs/icons/icons";
import { AnchorShrinkerDiv } from "@/libs/ui/shrinker";
import { usePathContext } from "@hazae41/chemin";
import { useAppRequests } from "../entities/requests/data";

export function Bottom() {
  const { url } = usePathContext().unwrap()

  const requestsQuery = useAppRequests()
  const requests = requestsQuery.data?.get()

  return <nav className="h-16 w-full flex-none border-t border-t-contrast">
    <div className="w-full h-16 px-4 m-auto max-w-3xl flex items-center">
      <a className={`group grow text-contrast data-[selected=true]:text-default`}
        data-selected={url.pathname === "/home"}
        href="#/home">
        <AnchorShrinkerDiv>
          <Outline.HomeIcon className="size-6" />
        </AnchorShrinkerDiv>
      </a>
      <a className={`group grow text-contrast data-[selected=true]:text-default`}
        data-selected={url.pathname === "/wallets"}
        href="#/wallets">
        <AnchorShrinkerDiv>
          <Outline.WalletIcon className="size-6" />
        </AnchorShrinkerDiv>
      </a>
      <a className={`group grow text-contrast data-[selected=true]:text-default`}
        data-selected={url.pathname === "/seeds"}
        href="#/seeds">
        <AnchorShrinkerDiv>
          <Outline.SparklesIcon className="size-6" />
        </AnchorShrinkerDiv>
      </a>
      <a className="group grow text-contrast data-[selected=true]:text-default"
        data-selected={url.pathname === "/sessions"}
        href="#/sessions">
        <AnchorShrinkerDiv>
          <Outline.GlobeAltIcon className="size-6" />
        </AnchorShrinkerDiv>
      </a>
      <a className="group grow text-contrast data-[selected=true]:text-default"
        data-selected={url.pathname === "/requests"}
        href="#/requests">
        <AnchorShrinkerDiv>
          <div className="relative">
            {Boolean(requests?.length) &&
              <div className="absolute top-0 -right-2">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-purple-400" />
                </span>
              </div>}
            <Outline.CheckIcon className="size-6" />
          </div>
        </AnchorShrinkerDiv>
      </a>
      <a className="group grow text-contrast data-[selected=true]:text-default"
        data-selected={url.pathname === "/settings"}
        href="#/settings">
        <AnchorShrinkerDiv>
          <Outline.CogIcon className="size-6" />
        </AnchorShrinkerDiv>
      </a>
    </div>
  </nav>
}