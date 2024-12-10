import { LocaleProvider } from "@/mods/foreground/global/mods/locale"
import { Router } from "@/mods/foreground/router/router"

export interface Params {
  readonly locale: string
}

export function getStaticPaths() {
  return {
    paths: [
      {
        "params": {
          "locale": "en"
        }
      },
      {
        "params": {
          "locale": "zh"
        }
      },
      {
        "params": {
          "locale": "hi"
        }
      },
      {
        "params": {
          "locale": "es"
        }
      },
      {
        "params": {
          "locale": "ar"
        }
      },
      {
        "params": {
          "locale": "fr"
        }
      },
      {
        "params": {
          "locale": "de"
        }
      },
      {
        "params": {
          "locale": "ru"
        }
      },
      {
        "params": {
          "locale": "pt"
        }
      },
      {
        "params": {
          "locale": "ja"
        }
      },
      {
        "params": {
          "locale": "pa"
        }
      },
      {
        "params": {
          "locale": "bn"
        }
      },
      {
        "params": {
          "locale": "id"
        }
      },
      {
        "params": {
          "locale": "ur"
        }
      },
      {
        "params": {
          "locale": "ms"
        }
      },
      {
        "params": {
          "locale": "it"
        }
      },
      {
        "params": {
          "locale": "tr"
        }
      },
      {
        "params": {
          "locale": "ta"
        }
      },
      {
        "params": {
          "locale": "te"
        }
      },
      {
        "params": {
          "locale": "ko"
        }
      },
      {
        "params": {
          "locale": "vi"
        }
      },
      {
        "params": {
          "locale": "pl"
        }
      },
      {
        "params": {
          "locale": "ro"
        }
      },
      {
        "params": {
          "locale": "nl"
        }
      },
      {
        "params": {
          "locale": "el"
        }
      },
      {
        "params": {
          "locale": "th"
        }
      },
      {
        "params": {
          "locale": "cs"
        }
      },
      {
        "params": {
          "locale": "hu"
        }
      },
      {
        "params": {
          "locale": "sv"
        }
      },
      {
        "params": {
          "locale": "da"
        }
      }
    ],
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

  return <LocaleProvider value={locale}>
    <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
      <Router />
    </main>
  </LocaleProvider>
}