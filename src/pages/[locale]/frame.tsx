import { Director, Localizer } from "@/mods/foreground/global/mods/locale"
import { Locale } from "@/mods/foreground/locale"
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

  return <Localizer value={locale}>
    <Director>
      <main id="root" className="h-full w-full flex flex-col overflow-hidden animate-opacity-in">
        <Router />
      </main>
    </Director>
  </Localizer>
}