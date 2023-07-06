import { Head, Html, Main, NextScript } from 'next/document'

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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}