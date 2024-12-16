import { ChildrenProps } from "@/libs/react/props/children"
import { useLocaleContext } from "@/mods/foreground/global/mods/locale"
import { Locale } from "@/mods/foreground/locale"

export function ContrastLabel(props: ChildrenProps) {
  const lang = useLocaleContext().getOrThrow()
  const { children } = props

  return <label className="po-md flex flex-row data-[dir=rtl]:flex-row-reverse items-start bg-contrast rounded-xl"
    data-dir={Locale.get(Locale.direction, lang)}>
    {children}
  </label>
}