import { Head, Html, Main, NextScript } from 'next/document'
import Script from "next/script"

const themer = `const t=matchMedia("(prefers-color-scheme: dark)"),e=document.querySelector("meta[name=theme-color]");function c(c){const o=t.matches?"dark":"white",n=c||o;"dark"===n&&(document.documentElement.classList.add("dark"),e.setAttribute("content","#000000")),"light"===n&&(document.documentElement.classList.remove("dark"),e.setAttribute("content","#ffffff"))}!function(){const t=localStorage.getItem("theme");"dark"===t&&c("dark"),"light"===t&&c("light")}();`

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta key="application-name" name="application-name" content="Brume Wallet" />
        <meta key="description" name="description" content="The private wallet" />
        <meta key="color-scheme" name="color-scheme" content="dark light" />
        <meta key="theme-color-light" name="theme-color" content="#ffffff" />
        <meta key="theme-color-dark" name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta key="apple-mobile-web-app-capable" name="apple-mobile-web-app-capable" content="yes" />
        <meta key="apple-mobile-web-app-status-bar-style" name="apple-mobile-web-app-status-bar-style" content="white" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/square.png" />
        <link rel="apple-touch-startup-image" href="/round.png" />
        <Script id="themer" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themer }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}