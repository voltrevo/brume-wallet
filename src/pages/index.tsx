import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Router } from "@/mods/foreground/router/router";
import { config } from "./_document";

export default function Main() {
  config.lang = undefined

  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
    <Overlay>
      <Router />
    </Overlay>
  </main>
}
