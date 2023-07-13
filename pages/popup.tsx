import { BigInts } from "@/libs/bigints/bigints";
import { Button } from "@/libs/components/button";
import { Ethers } from "@/libs/ethers/ethers";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { RpcErr, RpcError, RpcOk } from "@/libs/rpc";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header";
import { Page } from "@/mods/foreground/components/page/page";
import { useSession } from "@/mods/foreground/entities/sessions/data";
import { UserProvider } from "@/mods/foreground/entities/users/context";
import { WalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create";
import { useWallets } from "@/mods/foreground/entities/wallets/all/data";
import { ClickableWalletGrid } from "@/mods/foreground/entities/wallets/all/page";
import { Wallets, useEthereumContext2, useGasPrice, useNonce, useWallet } from "@/mods/foreground/entities/wallets/data";
import { UserRejectionError } from "@/mods/foreground/errors/errors";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Path, usePath } from "@/mods/foreground/router/path";
import { Router } from "@/mods/foreground/router/router";
import { Bytes } from "@hazae41/bytes";
import { Option } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Popup() {
  const background = useBackground()

  useEffect(() => {
    background
      .tryRequest<void>({ method: "popup_hello" })
      .then(r => r.unwrap().ignore())
  }, [background])

  return <main id="main" className="p-safe grow w-full flex flex-col">
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

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const sessionId = Option.wrap(searchParams.get("sessionId")).unwrap()

  const from = Option.wrap(searchParams.get("from")).unwrap()
  const to = Option.wrap(searchParams.get("to")).unwrap()
  const gas = Option.wrap(searchParams.get("gas")).unwrap()

  const value = searchParams.get("value")
  const data = searchParams.get("data")

  const sessionQuery = useSession(sessionId)
  const maybeSession = sessionQuery.data?.inner

  const walletQuery = useWallet(maybeSession?.wallet.uuid, background)
  const maybeWallet = walletQuery.data?.inner

  const context = useEthereumContext2(maybeSession?.wallet, maybeSession?.chain)

  const gasPriceQuery = useGasPrice(context)
  const maybeGasPrice = gasPriceQuery.data?.inner

  const nonceQuery = useNonce(maybeWallet?.address, context)
  const maybeNonce = nonceQuery.data?.inner

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const session = Option.wrap(maybeSession).ok().throw(t)
      const wallet = Option.wrap(maybeWallet).ok().throw(t)
      const gasPrice = Option.wrap(maybeGasPrice).ok().throw(t)
      const nonce = Option.wrap(maybeNonce).ok().throw(t)

      const privateKey = await Wallets.tryGetPrivateKey(wallet, background).then(r => r.throw(t))

      const ewallet = Ethers.Wallet.tryFrom(privateKey).throw(t)

      const signature = await Result.catchAndWrap(async () => {
        return await ewallet.signTransaction({
          data: data,
          to: to,
          from: from,
          gasLimit: gas,
          chainId: session.chain.chainId,
          gasPrice: gasPrice,
          nonce: Number(nonce),
          value: value
        })
      }).then(r => r.throw(t))

      await background.tryRequest({
        method: "popup_data",
        params: [new RpcOk(id, signature)]
      }).then(r => r.throw(t).throw(t))

      Path.go("/done")

      return Ok.void()
    }).then(r => r.unwrap())
  }, [background, id, maybeWallet, maybeSession, maybeGasPrice, maybeNonce])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      Path.go("/done")

      return Ok.void()
    }).then(r => r.unwrap())
  }, [background, id])

  const loading = useMemo(() => {
    if (onApprove.loading)
      return true
    if (gasPriceQuery.data == null)
      return true
    if (nonceQuery.data == null)
      return true
    return false
  }, [onApprove.loading, gasPriceQuery.data, nonceQuery.data])

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
      <Button.Contrast className="grow p-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onReject.run}
        disabled={onReject.loading}>
        <Button.Shrink>
          <Outline.XMarkIcon className="icon-sm" />
          No, reject it
        </Button.Shrink>
      </Button.Contrast>
      <Button.Gradient className="grow p-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onApprove.run}
        disabled={loading}
        colorIndex={5}>
        <Button.Shrink>
          <Outline.CheckIcon className="icon-sm" />
          Yes, approve it
        </Button.Shrink>
      </Button.Gradient>
    </div>
  </Page>
}

export function SwitchPage() {
  const { searchParams } = usePath()
  const background = useBackground()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcOk(id, undefined)]
      }).then(r => r.throw(t).throw(t))

      Path.go("/done")

      return Ok.void()
    }).then(r => r.unwrap())
  }, [background, id])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      Path.go("/done")

      return Ok.void()
    }).then(r => r.unwrap())
  }, [background, id])

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
      <Button.Contrast className="grow p-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onReject.run}
        disabled={onReject.loading}>
        <Button.Shrink>
          <Outline.XMarkIcon className="icon-sm" />
          No, reject it
        </Button.Shrink>
      </Button.Contrast>
      <Button.Gradient className="grow p-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onApprove.run}
        disabled={onApprove.loading}
        colorIndex={5}>
        <Button.Shrink>
          <Outline.CheckIcon className="icon-sm" />
          Yes, approve it
        </Button.Shrink>
      </Button.Gradient>
    </div>
  </Page>
}

export function PersonalSignPage() {
  const { searchParams } = usePath()
  const background = useBackground()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const sessionId = Option.wrap(searchParams.get("sessionId")).unwrap()

  const message = Option.wrap(searchParams.get("message")).unwrap()

  const sessionQuery = useSession(sessionId)
  const maybeSession = sessionQuery.data?.inner

  const walletQuery = useWallet(maybeSession?.wallet.uuid, background)
  const maybeWallet = walletQuery.data?.inner

  const userMessage = useMemo(() => {
    return message.startsWith("0x")
      ? Bytes.toUtf8(Bytes.fromHexSafe(message.slice(2)))
      : message
  }, [message])

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const wallet = Option.wrap(maybeWallet).ok().throw(t)

      const privateKey = await Wallets.tryGetPrivateKey(wallet, background).then(r => r.throw(t))

      const ewallet = Ethers.Wallet.tryFrom(privateKey).throw(t)

      const signature = await Result.catchAndWrap(async () => {
        return await ewallet.signMessage(userMessage)
      }).then(r => r.throw(t))

      await background.tryRequest({
        method: "popup_data",
        params: [new RpcOk(id, signature)]
      }).then(r => r.throw(t).throw(t))

      Path.go("/done")

      return Ok.void()
    }).then(r => r.unwrap())
  }, [background, id, maybeWallet, userMessage])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      Path.go("/done")

      return Ok.void()
    }).then(r => r.unwrap())
  }, [background, id])

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
        {userMessage}
      </div>
    </div>
    <div className="p-xmd w-full flex items-center gap-2">
      <Button.Contrast className="grow p-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onReject.run}
        disabled={onReject.loading}>
        <Button.Shrink>
          <Outline.XMarkIcon className="icon-sm" />
          No, reject it
        </Button.Shrink>
      </Button.Contrast>
      <Button.Gradient className="grow p-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onApprove.run}
        disabled={onApprove.loading}
        colorIndex={5}>
        <Button.Shrink>
          <Outline.CheckIcon className="icon-sm" />
          Yes, approve it
        </Button.Shrink>
      </Button.Gradient>
    </div>
  </Page>
}

export function TypedSignPage() {
  const { searchParams } = usePath()
  const background = useBackground()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const sessionId = Option.wrap(searchParams.get("sessionId")).unwrap()

  const data = Option.wrap(searchParams.get("data")).unwrap()

  const sessionQuery = useSession(sessionId)
  const maybeSession = sessionQuery.data?.inner

  const walletQuery = useWallet(maybeSession?.wallet.uuid, background)
  const maybeWallet = walletQuery.data?.inner

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const wallet = Option.wrap(maybeWallet).ok().throw(t)

      const { domain, types, message } = JSON.parse(data)

      delete types["EIP712Domain"]

      const privateKey = await Wallets.tryGetPrivateKey(wallet, background).then(r => r.throw(t))

      const ewallet = Ethers.Wallet.tryFrom(privateKey).throw(t)

      const signature = await Result.catchAndWrap(async () => {
        return await ewallet.signTypedData(domain, types, message)
      }).then(r => r.throw(t))

      await background.tryRequest({
        method: "popup_data",
        params: [new RpcOk(id, signature)]
      }).then(r => r.throw(t).throw(t))

      Path.go("/done")

      return Ok.void()
    }).then(r => r.unwrap())
  }, [background, id, maybeWallet, data])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      Path.go("/done")

      return Ok.void()
    }).then(r => r.unwrap())
  }, [background, id])

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
        {JSON.stringify(JSON.parse(data))}
      </div>
    </div>
    <div className="p-xmd w-full flex items-center gap-2">
      <Button.Contrast className="grow p-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onReject.run}
        disabled={onReject.loading}>
        <Button.Shrink>
          <Outline.XMarkIcon className="icon-sm" />
          No, reject it
        </Button.Shrink>
      </Button.Contrast>
      <Button.Gradient className="grow p-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onApprove.run}
        disabled={onApprove.loading}
        colorIndex={5}>
        <Button.Shrink>
          <Outline.CheckIcon className="icon-sm" />
          Yes, approve it
        </Button.Shrink>
      </Button.Gradient>
    </div>
  </Page>
}

export function WalletAndChainSelectPage() {
  const { searchParams } = usePath()
  const background = useBackground()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const wallets = useWallets(background)

  const creator = useBooleanHandle(false)

  const [chain, setChain] = useState<number>(1)

  const onWalletClick = useAsyncUniqueCallback(async (wallet: Wallet) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcOk(id, [wallet.uuid, chain])]
      }).then(r => r.throw(t).throw(t))

      Path.go("/done")

      return Ok.void()
    }).then(r => r.unwrap())
  }, [background, id, chain])

  const Body =
    <PageBody>
      <div className="flex flex-wrap items-center gap-1">
        <Button.Bordered className="p-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === 1}
          onClick={() => setChain(1)}>
          <Button.Shrink>
            <Outline.CubeIcon className="icon-xs" />
            Ethereum
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="p-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === 137}
          onClick={() => setChain(137)}>
          <Button.Shrink>
            <Outline.CubeIcon className="icon-xs" />
            Polygon
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="p-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === 5}
          onClick={() => setChain(5)}>
          <Button.Shrink>
            <Outline.CubeIcon className="icon-xs" />
            Goerli
          </Button.Shrink>
        </Button.Bordered>
      </div>
      <div className="h-4" />
      <ClickableWalletGrid
        ok={onWalletClick.run}
        create={creator.enable}
        wallets={wallets.data?.inner} />
    </PageBody>

  const Header =
    <PageHeader title="Choose a wallet">
      <Button.Naked className="icon-xl hovered-or-clicked-or-focused:scale-105 transition"
        onClick={creator.enable}>
        <Outline.PlusIcon className="icon-sm" />
      </Button.Naked>
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
      <Button.Opposite className="grow p-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onDone}>
        <Button.Shrink>
          <Outline.HomeIcon className="icon-xs" />
          Go to the home page
        </Button.Shrink>
      </Button.Opposite>
    </div>
  </Page>
}