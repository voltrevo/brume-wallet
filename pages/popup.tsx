import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { OkProps } from "@/libs/react/props/promise";
import { useBackground } from "@/mods/foreground/background/context";
import { ContrastButtonChip } from "@/mods/foreground/components/buttons/chips/contrast";
import { InnerButtonChip } from "@/mods/foreground/components/buttons/chips/naked";
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

  const [step, setStep] = useState(0)

  const next = useCallback(() => {
    setStep(x => x + 1)
  }, [])

  return <main className="p-safe h-full w-full">
    <Overlay>
      <UserProvider>
        {step === 0 &&
          <WalletAndChainSelectPage ok={next} />}
        {step === 1 &&
          <ConnectedPage />}
      </UserProvider>
    </Overlay>
  </main>
}

export function ConnectedPage() {
  const router = useRouter()

  const onDone = useCallback(() => {
    router.push("/")
  }, [router])

  return <Page>
    <div className="p-4 grow flex flex-col items-center justify-evenly">
      <div className="w-full">
        <div className="text-center text-xl font-medium">
          Connected
        </div>
        <div className="w-full max-w-[230px] m-auto text-center text-contrast">
          You can now close this window or go to the home page
        </div>
      </div>
      <ContrastButtonChip onClick={onDone} >
        <InnerButtonChip icon={Outline.HomeIcon}>
          Go to the home page
        </InnerButtonChip>
      </ContrastButtonChip>
    </div>
  </Page>
}

export function WalletAndChainSelectPage(props: OkProps<void>) {
  const background = useBackground()
  const { ok } = props

  const wallets = useWallets(background)

  const creator = useBooleanHandle(false)

  const [chain, setChain] = useState<number>(1)

  const onWalletClick = useCallback(async (wallet: Wallet) => {
    await background
      .tryRequest({ method: "brume_popupData", params: [wallet.uuid, chain] })
      .then(r => r.unwrap().unwrap())
    ok()
  }, [background, chain, ok])

  const Body =
    <PageBody>
      <div className="flex flex-wrap items-center gap-1">
        <ContrastButtonChip
          aria-selected={chain === 1}
          onClick={() => setChain(1)}>
          <InnerButtonChip icon={Outline.CubeIcon}>
            Ethereum
          </InnerButtonChip>
        </ContrastButtonChip>
        <ContrastButtonChip
          aria-selected={chain === 137}
          onClick={() => setChain(137)}>
          <InnerButtonChip icon={Outline.CubeIcon}>
            Polygon
          </InnerButtonChip>
        </ContrastButtonChip>
        <ContrastButtonChip
          aria-selected={chain === 5}
          onClick={() => setChain(5)}>
          <InnerButtonChip icon={Outline.CubeIcon}>
            Goerli
          </InnerButtonChip>
        </ContrastButtonChip>
      </div>
      <div className="h-4" />
      <ClickableWalletGrid
        ok={onWalletClick}
        create={creator.enable}
        wallets={wallets.data?.inner} />
    </PageBody>

  const Header =
    <PageHeader title="Choose a wallet">
      <button className="group icon-xl flex justify-center items-center"
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

