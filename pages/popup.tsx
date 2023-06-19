import { useBackground } from "@/mods/foreground/background/context";
import { UserProvider } from "@/mods/foreground/entities/users/context";
import { WalletsPage } from "@/mods/foreground/entities/wallets/all/page";
import { Wallet } from "@/mods/foreground/entities/wallets/data";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export default function Popup() {
  const router = useRouter()
  const background = useBackground()

  useEffect(() => {
    background
      .tryRequest<void>({ method: "brume_popupHello" })
      .then(r => r.unwrap().unwrap())
  }, [background])

  const [chain, setChain] = useState<number>(137)

  const onWalletSelected = useCallback(async (wallet: Wallet) => {
    await background
      .tryRequest({ method: "brume_popupData", params: [wallet.uuid, chain] })
      .then(r => r.unwrap().unwrap())
    router.push("/")
  }, [background, router, chain])

  return <main className="p-safe h-full w-full">
    <Overlay>
      <UserProvider>
        <WalletsPage
          title="Select a wallet"
          showTotalBalance={false}
          ok={onWalletSelected} />
      </UserProvider>
    </Overlay>
  </main>
}

