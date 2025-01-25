import { LocaleContext } from "@/mods/foreground/global/mods/locale"
import { Locale } from "@/mods/foreground/locale"
import { Overlay } from "@/mods/foreground/overlay/overlay"
import { Router } from "@/mods/foreground/router/router"

export interface Params {
  readonly locale: string
}

export function getStaticPaths() {
  return {
    paths: Locale.codes.map(locale => ({ params: { locale } })),
    fallback: false
  }
}

export function getStaticProps(context: {
  readonly params: Params
}) {
  return { props: context.params }
}

export default function Main(props: Params) {
  const { locale } = props

  return <LocaleContext value={locale}>
    <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
      <Overlay>
        <Router />
      </Overlay>
    </main>
  </LocaleContext>
}