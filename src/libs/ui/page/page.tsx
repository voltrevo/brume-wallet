import { Outline } from "@/libs/icons/icons";
import { ChildrenProps } from "@/libs/react/props/children";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { GlobalBottomNavigation, UserBottomNavigation } from "@/mods/foreground/overlay/bottom";
import { useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";

export function UserPage(props: ChildrenProps) {
  const lang = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const subpath = useHashSubpath(path)
  const { children } = props

  const omnidialog = useCoords(subpath, "/...")

  return <>
    <div className="grow w-full flex flex-col overflow-y-scroll">
      <div className="hidden md:block po-md border-b-contrast">
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
          <div className="flex-1 flex items-center po-md bg-contrast rounded-xl">
            <Outline.SparklesIcon className="size-4" />
            <div className="w-2" />
            <input className="w-full bg-transparent outline-none"
              // placeholder={Locale.get(Locale.tellMeWhatYouWant, lang)}
              onKeyDown={omnidialog.onKeyDown}
              onClick={omnidialog.onClick} />
          </div>
          <div className="w-2" />
          <div className="flex-1" />
        </div>
      </div>
      <div className="grow w-full m-auto max-w-3xl flex flex-col">
        {children}
      </div>
    </div>
    <UserBottomNavigation />
  </>
}

export function GlobalPage(props: ChildrenProps) {
  const lang = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const subpath = useHashSubpath(path)
  const { children } = props

  const omnidialog = useCoords(subpath, "/...")

  return <>
    <div className="grow w-full flex flex-col overflow-y-scroll">
      <div className="hidden md:block po-md border-b-contrast">
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
          <div className="flex-1 flex items-center po-md bg-contrast rounded-xl">
            <Outline.SparklesIcon className="size-4" />
            <div className="w-2" />
            <input className="w-full bg-transparent outline-none"
              // placeholder={Locale.get(Locale.tellMeWhatYouWant, lang)}
              onKeyDown={omnidialog.onKeyDown}
              onClick={omnidialog.onClick} />
          </div>
          <div className="w-2" />
          <div className="flex-1" />
        </div>
      </div>
      <div className="grow w-full m-auto max-w-3xl flex flex-col">
        {children}
      </div>
    </div>
    <GlobalBottomNavigation />
  </>
}