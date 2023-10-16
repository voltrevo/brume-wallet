import { BackgroundGuard } from "@/mods/foreground/background/context";
import { UserGuard } from "@/mods/foreground/entities/users/context";
import { Bottom } from "@/mods/foreground/overlay/bottom";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Router } from "@/mods/foreground/router/router";

export default function Index() {
  return <main id="main" className="p-safe grow w-full flex flex-col overflow-hidden">
    <Overlay>
      <BackgroundGuard>
        <UserGuard>
          <div className="grow w-full flex flex-col overflow-y-scroll">
            <div className="grow w-full m-auto max-w-3xl flex flex-col">
              <Router />
            </div>
          </div>
          <Bottom />
        </UserGuard>
      </BackgroundGuard>
    </Overlay>
  </main>
}
