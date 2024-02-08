import { useBackgroundContext } from "@/mods/foreground/background/context";
import { NavBar } from "@/mods/foreground/overlay/navbar";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Router } from "@/mods/foreground/router/router";
import { useEffect } from "react";

export default function Action() {
  const background = useBackgroundContext().unwrap()

  useEffect(() => {
    /**
     * Chromium
     */
    document.documentElement.classList.add("h-[600px", "w-[400px]")
    /**
     * Firefox
     */
    document.body.classList.add("h-[600px]", "w-[400px]")
  }, [])

  useEffect(() => {
    background.requestOrThrow<string>({
      method: "brume_getPath"
    }).then(r => location.hash = r.unwrap())

    const onHashChange = () => background.requestOrThrow<void>({
      method: "brume_setPath",
      params: [location.hash]
    }).then(r => r.unwrap())

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [background])

  return <main id="main" className="grow w-full flex flex-col overflow-hidden">
    <NavBar />
    <Overlay>
      <Router />
    </Overlay>
  </main >
}