import { Outline } from "@/libs/icons/icons";
import { Director, Localizer, useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { UserBottomNavigation } from "@/mods/foreground/overlay/bottom";
import { useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { Nullable } from "@hazae41/option";
import { useEffect, useMemo, useState } from "react";

export default function Main() {
  const [hash, setHash] = useState(location.hash)

  useEffect(() => {
    const onHashChange = () => setHash(location.hash)
    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    location.hash = hash
  }, [hash])

  const url = useMemo(() => {
    const url = new URL("/frame", location.href)
    url.hash = hash
    return url
  }, [hash])

  const [iframe, setIframe] = useState<Nullable<HTMLIFrameElement>>()

  const subwindow = useMemo(() => {
    if (iframe == null)
      return
    if (iframe.contentWindow == null)
      return
    return iframe.contentWindow
  }, [iframe])

  useEffect(() => {
    if (subwindow == null)
      return
    const onSubwindowHashChange = () => setHash(subwindow.location.hash)
    subwindow.addEventListener("hashchange", onSubwindowHashChange, { passive: true })
    return () => subwindow.removeEventListener("hashchange", onSubwindowHashChange)
  }, [subwindow])

  return <Localizer value={undefined}>
    <Director>
      <main id="root" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
        <Topbar />
        <iframe className="grow w-full"
          ref={setIframe}
          src={url.href}
          seamless />
        <UserBottomNavigation />
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