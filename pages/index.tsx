import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Router } from "@/mods/foreground/router/router";

export default function Main() {
  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden">
    <Overlay>
      <Router />
    </Overlay>
  </main>
}
