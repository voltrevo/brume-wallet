import { BigInts } from "@/libs/bigints/bigints";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { useBackground } from "@/mods/foreground/background/context";
import { InnerButton } from "@/mods/foreground/components/buttons/button";
import { ContrastButtonChip } from "@/mods/foreground/components/buttons/chips/contrast";
import { InnerButtonChip } from "@/mods/foreground/components/buttons/chips/naked";
import { ContrastButton } from "@/mods/foreground/components/buttons/contrast";
import { GradientButton } from "@/mods/foreground/components/buttons/gradient";
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header";
import { Page } from "@/mods/foreground/components/page/page";
import { UserProvider } from "@/mods/foreground/entities/users/context";
import { WalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create";
import { useWallets } from "@/mods/foreground/entities/wallets/all/data";
import { ClickableWalletGrid } from "@/mods/foreground/entities/wallets/all/page";
import { Wallet } from "@/mods/foreground/entities/wallets/data";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Path, usePath } from "@/mods/foreground/router/path";
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

export function TransactPage() {
  const { searchParams } = usePath()
  const background = useBackground()

  const onApprove = useCallback(async () => {
    await background.tryRequest({
      method: "brume_data",
      params: [{
        method: "eth_sendTransaction",
        params: [true]
      }]
    }).then(r => r.unwrap().unwrap())
    Path.go("/done")
  }, [background])

  const onReject = useCallback(async () => {
    await background.tryRequest({
      method: "brume_data",
      params: [{
        method: "eth_sendTransaction",
        params: [false]
      }]
    }).then(r => r.unwrap().unwrap())
    Path.go("/done")
  }, [background])

  const to = searchParams.get("to")
  const value = searchParams.get("value")
  const data = searchParams.get("data")

  return <Page>
    <div className="p-xmd grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Transaction
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        Do you want to approve this transaction?
      </div>
    </div>
    <div className="w-full p-xmd grow flex flex-col">
      <div className="w-full p-xmd border border-contrast rounded-xl whitespace-pre-wrap break-words">
        To: {to}
      </div>
      {value &&
        <div className="w-full p-xmd border border-contrast rounded-xl whitespace-pre-wrap mt-2 break-words">
          Value: {BigInts.float(BigInts.parse(value), 18)}
        </div>}
      {data &&
        <div className="grow w-full p-xmd border border-contrast rounded-xl whitespace-pre-wrap mt-2 break-words">
          Data: {data}
        </div>}
    </div>
    <div className="p-xmd w-full flex items-center gap-2">
      <ContrastButton className="grow"
        onClick={onReject}>
        <InnerButton
          icon={Outline.XMarkIcon}>
          No, reject it
        </InnerButton>
      </ContrastButton>
      <GradientButton className="grow"
        onClick={onApprove}
        colorIndex={5}>
        <InnerButton icon={Outline.CheckIcon}>
          Yes, approve it
        </InnerButton>
      </GradientButton>
    </div>
  </Page>
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
    <div className="p-xmd grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Switch chain
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        Do you want to switch the Ethereum chain?
      </div>
    </div>
    <div className="p-xmd w-full flex items-center gap-2">
      <ContrastButton className="grow"
        onClick={onReject}>
        <InnerButton
          icon={Outline.XMarkIcon}>
          No, reject it
        </InnerButton>
      </ContrastButton>
      <GradientButton className="grow"
        onClick={onApprove}
        colorIndex={5}>
        <InnerButton icon={Outline.CheckIcon}>
          Yes, approve it
        </InnerButton>
      </GradientButton>
    </div>
  </Page>
}

export function PersonalSignPage() {
  const { searchParams } = usePath()
  const background = useBackground()

  const onApprove = useCallback(async () => {
    await background.tryRequest({
      method: "brume_data",
      params: [{
        method: "personal_sign",
        params: [true]
      }]
    }).then(r => r.unwrap().unwrap())
    Path.go("/done")
  }, [background])

  const onReject = useCallback(async () => {
    await background.tryRequest({
      method: "brume_data",
      params: [{
        method: "personal_sign",
        params: [false]
      }]
    }).then(r => r.unwrap().unwrap())
    Path.go("/done")
  }, [background])

  const message = searchParams.get("message")

  if (message === null)
    return null

  return <Page>
    <div className="p-xmd grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Sign message
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        Do you want to sign the following message?
      </div>
    </div>
    <div className="w-full p-xmd grow">
      <div className="h-full w-full p-xmd border border-contrast rounded-xl whitespace-pre-wrap break-words">
        {message}
      </div>
    </div>
    <div className="p-xmd w-full flex items-center gap-2">
      <ContrastButton className="grow"
        onClick={onReject}>
        <InnerButton
          icon={Outline.XMarkIcon}>
          No, reject it
        </InnerButton>
      </ContrastButton>
      <GradientButton className="grow"
        onClick={onApprove}
        colorIndex={5}>
        <InnerButton icon={Outline.CheckIcon}>
          Yes, approve it
        </InnerButton>
      </GradientButton>
    </div>
  </Page>
}

export function TypedSignPage() {
  const { searchParams } = usePath()
  const background = useBackground()

  const onApprove = useCallback(async () => {
    await background.tryRequest({
      method: "brume_data",
      params: [{
        method: "eth_signTypedData_v4",
        params: [true]
      }]
    }).then(r => r.unwrap().unwrap())
    Path.go("/done")
  }, [background])

  const onReject = useCallback(async () => {
    await background.tryRequest({
      method: "brume_data",
      params: [{
        method: "eth_signTypedData_v4",
        params: [false]
      }]
    }).then(r => r.unwrap().unwrap())
    Path.go("/done")
  }, [background])

  const message = searchParams.get("message")

  if (message === null)
    return null

  return <Page>
    <div className="p-xmd grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Sign message
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        Do you want to sign the following message?
      </div>
    </div>
    <div className="w-full p-xmd grow">
      <div className="h-full w-full p-xmd border border-contrast rounded-xl whitespace-pre-wrap break-words">
        {JSON.stringify(JSON.parse(message))}
      </div>
    </div>
    <div className="p-xmd w-full flex items-center gap-2">
      <ContrastButton className="grow"
        onClick={onReject}>
        <InnerButton
          icon={Outline.XMarkIcon}>
          No, reject it
        </InnerButton>
      </ContrastButton>
      <GradientButton className="grow"
        onClick={onApprove}
        colorIndex={5}>
        <InnerButton icon={Outline.CheckIcon}>
          Yes, approve it
        </InnerButton>
      </GradientButton>
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

export function DonePage() {
  const onDone = useCallback(() => {
    Path.go("/")
  }, [])

  return <Page>
    <div className="p-xmd grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Done
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        You can now close this window or go to the home page
      </div>
    </div>
    <div className="p-xmd w-full flex items-center gap-2">
      <ContrastButton className="grow"
        onClick={onDone}>
        <InnerButton
          icon={Outline.HomeIcon}>
          Go to the home page
        </InnerButton>
      </ContrastButton>
    </div>
  </Page>
}