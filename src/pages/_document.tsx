/* eslint-disable @next/next/no-sync-scripts */
import Document, { Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    const { locale = "en" } = this.props["__NEXT_DATA__"].props.pageProps

    return (
      <Html lang={locale}>
        <Head>
          <meta key="application-name" name="application-name" content="Brume Wallet" />
          <meta key="description" name="description" content="The private wallet" />
          <meta key="color-scheme" name="color-scheme" content="dark light" />
          <meta key="theme-color-light" name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
          <meta key="theme-color-dark" name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
          <meta key="mobile-web-app-capable" name="mobile-web-app-capable" content="yes" />
          <meta key="apple-mobile-web-app-title" name="apple-mobile-web-app-title" content="Brume Wallet" />
          <meta key="apple-mobile-web-app-status-bar-style" name="apple-mobile-web-app-status-bar-style" content="white" />
          <meta key="referrer" name="referrer" content="no-referrer" />
          {process.env.NODE_ENV === "production"
            ? <meta key="content-security-policy" httpEquiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'wasm-unsafe-eval'; img-src 'self' data: blob:; connect-src 'self' data: wss://snowflake.torproject.net;" />
            : <meta key="content-security-policy" httpEquiv="Content-Security-Policy" />}
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/appicon.png" />
          <script id="themer" src="/themer.js" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument