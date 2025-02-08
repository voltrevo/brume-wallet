import { Director, Localizer } from "@/mods/foreground/global/mods/locale";
import { Router } from "@/mods/foreground/router/router";

export default function Main() {
  return <Localizer value={undefined}>
    <Director>
      <main id="root" className="h-full w-full flex flex-col overflow-hidden animate-opacity-in">
        <Router />
      </main>
    </Director>
  </Localizer>
}
