import { browser, BrowserError } from "@/libs/browser/browser";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { NavBar } from "@/mods/foreground/overlay/navbar";
import { Nullable } from "@hazae41/option";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Main() {
  const background = useBackgroundContext().unwrap()

  useEffect(() => {
    document.documentElement.classList.add("h-[600px]", "w-[400px]")
    document.body.classList.add("h-[600px]", "w-[400px]")
  }, [])

  const getHashOrThrow = useCallback(async () => {
    return await background.requestOrThrow<string>({
      method: "brume_getPath"
    }).then(r => r.unwrap())
  }, [background])

  const setHashOrThrow = useCallback(async (hash: string) => {
    await background.requestOrThrow<void>({
      method: "brume_setPath",
      params: [hash]
    }).then(r => r.unwrap())
  }, [background])

  const [hash, setHash] = useState<string>()

  useEffect(() => {
    const onHashChange = () => setHash(location.hash)
    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    if (hash == null)
      return
    location.hash = hash
  }, [hash])

  const initHashOrThrow = useCallback(async () => {
    if (location.hash && location.hash !== "#/")
      setHash(location.hash)
    else
      setHash(await getHashOrThrow())
  }, [getHashOrThrow])

  useEffect(() => {
    initHashOrThrow().catch(console.error)
  }, [initHashOrThrow])

  useEffect(() => {
    if (hash == null)
      return
    setHashOrThrow(hash).catch(console.error)
  }, [setHashOrThrow, hash])

  const url = useMemo(() => {
    if (hash == null)
      return
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

  if (url == null)
    return null

  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
    <NavBar />
    <iframe className="grow w-full"
      ref={setIframe}
      src={url.href}
      seamless />
  </main >
}