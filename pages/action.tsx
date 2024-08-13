import { useBackgroundContext } from "@/mods/foreground/background/context";
import { NavBar } from "@/mods/foreground/overlay/navbar";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Router } from "@/mods/foreground/router/router";
import { useCallback, useEffect } from "react";

export default function Action() {
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

  useEffect(() => {
    getHashOrThrow().then(r => location.hash = r).catch(console.error)
  }, [getHashOrThrow])

  useEffect(() => {
    const onHashChange = () => setHashOrThrow(location.hash).catch(console.error)

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [ setHashOrThrow])

  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden">
    <NavBar />
    <Overlay>
      <Router />
    </Overlay>
  </main >
}