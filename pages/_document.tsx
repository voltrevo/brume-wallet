import { Head, Html, Main, NextScript } from 'next/document'
import Script from "next/script"

const themer = `(() => {
  const matcher = matchMedia("(prefers-color-scheme: dark)")

  function apply() {
    if (matcher.matches)
      document.documentElement.classList.add("dark")
    else
      document.documentElement.classList.remove("dark")
  }

  matcher.addEventListener("change", (e) => {
    apply()
  }, { passive: true })
  
  apply()
})()`

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <Script
          id="themer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themer }} />
        <meta key="application-name" name="application-name" content="Brume Wallet" />
        <meta key="description" name="description" content="The private wallet" />
        <meta key="color-scheme" name="color-scheme" content="dark light" />
        <meta key="theme-color-light" name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta key="theme-color-dark" name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta key="apple-mobile-web-app-capable" name="apple-mobile-web-app-capable" content="yes" />
        <meta key="apple-mobile-web-app-title" name="apple-mobile-web-app-title" content="Brume Wallet" />
        <meta key="apple-mobile-web-app-status-bar-style" name="apple-mobile-web-app-status-bar-style" content="white" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/square.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}