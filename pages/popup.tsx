import { useBackground } from "@/mods/foreground/background/context";
import { UserProvider } from "@/mods/foreground/entities/users/context";
import { WalletsPage } from "@/mods/foreground/entities/wallets/all/page";
import { Wallet } from "@/mods/foreground/entities/wallets/data";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export default function Page() {
  const router = useRouter()
  const background = useBackground()

  useEffect(() => {
    background
      .tryRequest<void>({ method: "brume_popupHello" })
      .then(r => r.unwrap().unwrap())
  }, [background])

  const onWalletClick = useCallback(async (wallet: Wallet) => {
    await background
      .tryRequest({ method: "brume_popupData", params: [wallet.uuid, 137] })
      .then(r => r.unwrap().unwrap())
    router.push("/")
  }, [background, router])

  const [wallet, setWallet] = useState<Wallet>()

  return <main className="p-safe h-full w-full">
    <Overlay>
      <UserProvider>
        <WalletsPage
          title="Select a wallet"
          showBalance={false}
          ok={setWallet} />
      </UserProvider>
    </Overlay>
  </main>
}