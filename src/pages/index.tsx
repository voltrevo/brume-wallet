import { Outline } from "@/libs/icons/icons";
import { Director, Localizer, useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { Router } from "@/mods/foreground/router/router";
import { useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";

export default function Main() {
  return <Localizer value={undefined}>
    <Director>
      <main id="root" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
        <Router />
      </main>
    </Director>
  </Localizer>
}


export function Topbar() {
  const locale = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()

  const hash = useHashSubpath(path)

  const omnidialog = useCoords(hash, "/...")

  return <div className="hidden md:block po-2 border-b-default-contrast">
    <div className="grow w-full m-auto max-w-6xl flex items-center">
      <div className="flex-1 flex items-center">
        <a className="flex items-center"
          href={path.go("/").href}>
          <img className="size-8"
            alt="Brume Wallet"
            src="/favicon.png" />
          <div className="w-2" />
          <div className="font-medium">
            Wallet
          </div>
        </a>
      </div>
      <div className="w-2" />
      <div className="flex-1 flex items-center po-2 bg-default-contrast rounded-xl">
        <Outline.SparklesIcon className="size-4" />
        <div className="w-2" />
        <input className="w-full bg-transparent outline-none"
          placeholder={Locale.get(Locale.tellMeWhatYouWant, locale)}
          onKeyDown={omnidialog.onKeyDown}
          onClick={omnidialog.onClick} />
      </div>
      <div className="w-2" />
      <div className="flex-1" />
    </div>
  </div>
}