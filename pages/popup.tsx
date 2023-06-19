import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { useBackground } from "@/mods/foreground/background/context";
import { ButtonInner, ContrastButtonChip } from "@/mods/foreground/components/buttons/chips";
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header";
import { Page } from "@/mods/foreground/components/page/page";
import { UserProvider } from "@/mods/foreground/entities/users/context";
import { WalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create";
import { useWallets } from "@/mods/foreground/entities/wallets/all/data";
import { ClickableWalletGrid } from "@/mods/foreground/entities/wallets/all/page";
import { Wallet } from "@/mods/foreground/entities/wallets/data";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export default function Popup() {
  const background = useBackground()

  useEffect(() => {
    background
      .tryRequest<void>({ method: "brume_popupHello" })
      .then(r => r.unwrap().ignore())
  }, [background])

  return <main className="p-safe h-full w-full">
    <Overlay>
      <UserProvider>
        <WalletAndChainSelectPage />
      </UserProvider>
    </Overlay>
  </main>
}

export function WalletAndChainSelectPage() {
  const router = useRouter()
  const background = useBackground()
  const wallets = useWallets(background)

  const creator = useBooleanHandle(false)

  const [chain, setChain] = useState<number>(1)

  const onWalletClick = useCallback(async (wallet: Wallet) => {
    await background
      .tryRequest({ method: "brume_popupData", params: [wallet.uuid, chain] })
      .then(r => r.unwrap().unwrap())
    router.push("/")
  }, [background, router, chain])

  const Body =
    <PageBody>
      <div className="flex flex-wrap items-center gap-1">
        <ContrastButtonChip
          aria-selected={chain === 1}
          onClick={() => setChain(1)}>
          <ButtonInner icon={Outline.CubeIcon}>
            Ethereum
          </ButtonInner>
        </ContrastButtonChip>
        <ContrastButtonChip
          aria-selected={chain === 137}
          onClick={() => setChain(137)}>
          <ButtonInner icon={Outline.CubeIcon}>
            Polygon
          </ButtonInner>
        </ContrastButtonChip>
        <ContrastButtonChip
          aria-selected={chain === 5}
          onClick={() => setChain(5)}>
          <ButtonInner icon={Outline.CubeIcon}>
            Goerli
          </ButtonInner>
        </ContrastButtonChip>
      </div>
      <div className="h-4" />
      <ClickableWalletGrid
        ok={onWalletClick}
        create={creator.enable}
        wallets={wallets.data?.inner} />
    </PageBody>

  const Header =
    <PageHeader title="Select wallet">
      <button className="rounded-full icon-xl flex justify-center items-center border border-contrast"
        onClick={creator.enable}>
        <Outline.PlusIcon className="icon-sm" />
      </button>
    </PageHeader>

  return <Page>
    {creator.current &&
      <WalletCreatorDialog
        close={creator.disable} />}
    {Header}
    {Body}
  </Page>
}

