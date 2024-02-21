import { useBackgroundContext } from "@/mods/foreground/background/context";
import { NavBar } from "@/mods/foreground/overlay/navbar";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Router } from "@/mods/foreground/router/router";
import { useEffect } from "react";

export default function Action() {
  const background = useBackgroundContext().unwrap()

  useEffect(() => {
    document.documentElement.classList.add("h-[600px]", "w-[400px]")
    document.body.classList.add("h-[600px]", "w-[400px]")
  }, [])

  useEffect(() => {
    background.requestOrThrow<string>({
      method: "brume_getPath"
    }).then(r => location.hash = r.unwrap())

    const onHashChange = () => void background.requestOrThrow<void>({
      method: "brume_setPath",
      params: [location.hash]
    }).then(r => r.unwrap())

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [background])

  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden">
    <NavBar />
    <Overlay>
      <Router />
    </Overlay>
  </main >
}