import { useBackground } from "@/mods/foreground/background/context";
import { UserProvider } from "@/mods/foreground/entities/users/context";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Router } from "@/mods/foreground/router/router";
import { useEffect } from "react";

export default function Action() {
  const background = useBackground()

  useEffect(() => {
    background
      .tryRequest<string>({ method: "brume_getPath" })
      .then(r => r.unwrap().unwrap())
      .then(r => location.hash = r)

    const onHashChange = () => background.tryRequest({
      method: "brume_setPath",
      params: [location.hash]
    }).then(r => r.unwrap().unwrap())

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [background])

  return <main id="main" className="h-[600px] w-[400px] overflow-y-scroll flex flex-col">
    <Overlay>
      <UserProvider>
        <Router />
      </UserProvider>
    </Overlay>
  </main>
}