import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
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
import { Path } from "@/mods/foreground/router/path";
import { Router } from "@/mods/foreground/router/router";
import { useCallback, useEffect, useState } from "react";

export default function Popup() {
  const background = useBackground()

  useEffect(() => {
    background
      .tryRequest<void>({ method: "brume_hello" })
      .then(r => r.unwrap().ignore())
  }, [background])

  return <main className="p-safe h-full w-full">
    <Overlay>
      <UserProvider>
        <Router />
      </UserProvider>
    </Overlay>
  </main>
}

export function SwitchPage() {
  const background = useBackground()

  const onApprove = useCallback(async () => {
    await background.tryRequest({
      method: "brume_data",
      params: [{
        method: "wallet_switchEthereumChain",
        params: [true]
      }]
    }).then(r => r.unwrap().unwrap())
    Path.go("/done")
  }, [background])

  const onReject = useCallback(async () => {
    await background.tryRequest({
      method: "brume_data",
      params: [{
        method: "wallet_switchEthereumChain",
        params: [false]
      }]
    }).then(r => r.unwrap().unwrap())
    Path.go("/done")
  }, [background])

  return <Page>
    <div className="p-4 grow flex flex-col items-center justify-evenly">
      <div className="w-full">
        <div className="text-center text-xl font-medium">
          Switch chain
        </div>
        <div className="w-full max-w-[230px] m-auto text-center text-contrast">
          Do you want to switch the Ethereum chain?
        </div>
      </div>
      <ContrastButtonChip onClick={onApprove} >
        <InnerButtonChip icon={Outline.CheckIcon}>
          Yes, approve it
        </InnerButtonChip>
      </ContrastButtonChip>
      <ContrastButtonChip onClick={onReject} >
        <InnerButtonChip icon={Outline.XMarkIcon}>
          No, reject it
        </InnerButtonChip>
      </ContrastButtonChip>
    </div>
  </Page>
}

export function DonePage() {

  const onDone = useCallback(() => {
    Path.go("/")
  }, [])

  return <Page>
    <div className="p-4 grow flex flex-col items-center justify-evenly">
      <div className="w-full">
        <div className="text-center text-xl font-medium">
          Done
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

export function WalletAndChainSelectPage() {
  const background = useBackground()

  const wallets = useWallets(background)

  const creator = useBooleanHandle(false)

  const [chain, setChain] = useState<number>(1)

  const onWalletClick = useCallback(async (wallet: Wallet) => {
    await background.tryRequest({
      method: "brume_data",
      params: [{
        method: "eth_requestAccounts",
        params: [wallet.uuid, chain]
      }]
    }).then(r => r.unwrap().unwrap())
    Path.go("/done")
  }, [background, chain])

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

