import { UserProvider } from "@/mods/foreground/entities/users/context";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Router } from "@/mods/foreground/router/router";

export default function Index() {
  return <main id="main" className="p-safe h-full w-full">
    <Overlay>
      <UserProvider>
        <Router />
      </UserProvider>
    </Overlay>
  </main>
}
