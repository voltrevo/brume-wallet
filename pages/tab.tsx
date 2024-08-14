import { browser, BrowserError } from "@/libs/browser/browser";
import { isSafariExtension } from "@/libs/platform/platform";
import { NavBar } from "@/mods/foreground/overlay/navbar";
import { Nullable } from "@hazae41/option";
import { useEffect, useMemo, useState } from "react";

export default function Action() {
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
    const url = new URL(BrowserError.runOrThrowSync(() => browser.runtime.getURL("/index.html")))
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

  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden">
    {isSafariExtension() && <NavBar />}
    <iframe className={`grow w-full animate-opacity-in`}
      ref={setIframe}
      src={url.href} />
  </main >
}