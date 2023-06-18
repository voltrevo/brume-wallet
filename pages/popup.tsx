import { UserProvider } from "@/mods/foreground/entities/users/context";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Router } from "@/mods/foreground/router/router";

export default function Page() {
  return <Overlay>
    <UserProvider>
      <Router />
    </UserProvider>
  </Overlay>
}