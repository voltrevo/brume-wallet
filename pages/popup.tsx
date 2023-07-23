import { BigInts } from "@/libs/bigints/bigints";
import { Button } from "@/libs/components/button";
import { Errors } from "@/libs/errors/errors";
import { Ethers } from "@/libs/ethers/ethers";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { RpcErr, RpcError, RpcOk } from "@/libs/rpc";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header";
import { Page } from "@/mods/foreground/components/page/page";
import { AppRequests } from "@/mods/foreground/entities/requests/all/data";
import { useAppRequest } from "@/mods/foreground/entities/requests/data";
import { useTemporarySession } from "@/mods/foreground/entities/sessions/data";
import { UserProvider } from "@/mods/foreground/entities/users/context";
import { WalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create";
import { useWallets } from "@/mods/foreground/entities/wallets/all/data";
import { ClickableWalletGrid } from "@/mods/foreground/entities/wallets/all/page";
import { Wallets, useEthereumContext2, useGasPrice, useNonce, useWallet } from "@/mods/foreground/entities/wallets/data";
import { UserRejectionError } from "@/mods/foreground/errors/errors";
import { Bottom } from "@/mods/foreground/overlay/bottom";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Path, usePath } from "@/mods/foreground/router/path";
import { Router } from "@/mods/foreground/router/router";
import { useUserStorage } from "@/mods/foreground/storage/user";
import { Bytes } from "@hazae41/bytes";
import { Option } from "@hazae41/option";
import { Err, Ok, Result } from "@hazae41/result";
import { useCore } from "@hazae41/xswr";
import { useEffect, useMemo, useState } from "react";

export default function Popup() {
  return <main id="main" className="p-safe grow w-full flex flex-col">
    <Overlay>
      <UserProvider>
        <Ready />
      </UserProvider>
    </Overlay>
  </main>
}

export function Ready() {
  const background = useBackground()

  useEffect(() => {
    background
      .tryRequest<void>({ method: "popup_hello" })
      .then(r => r.unwrap().ignore())
  }, [background])

  return <>
    <Router />
    <Bottom />
  </>
}

export function TransactPage() {
  const { searchParams } = usePath()
  const core = useCore().unwrap()
  const storage = useUserStorage().unwrap()
  const background = useBackground()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const requestQuery = useAppRequest(id)
  const maybeRequest = requestQuery.data?.inner

  const sessionQuery = useTemporarySession(maybeRequest?.session)
  const maybeSession = sessionQuery.data?.inner

  const walletQuery = useWallet(maybeSession?.wallets.at(0)?.uuid)
  const maybeWallet = walletQuery.data?.inner

  const from = Option.wrap(searchParams.get("from")).unwrap()
  const to = Option.wrap(searchParams.get("to")).unwrap()
  const gas = Option.wrap(searchParams.get("gas")).unwrap()

  const value = searchParams.get("value")
  const data = searchParams.get("data")

  const context = useEthereumContext2(maybeSession?.wallets.at(0), maybeSession?.chain)

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

      if (wallet.type === "readonly")
        return new Err(new Error(`This wallet is readonly`))

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

      const requestsQuery = await AppRequests.get(storage).make(core)

      if (requestsQuery.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [core, storage, background, id, maybeWallet, maybeSession, maybeGasPrice, maybeNonce])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = await AppRequests.get(storage).make(core)

      if (requestsQuery.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [core, storage, background, id])

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
    <div className="p-4 grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Transaction
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        Do you want to approve this transaction?
      </div>
    </div>
    <div className="w-full p-4 grow flex flex-col">
      <div className="w-full p-4 border border-contrast rounded-xl whitespace-pre-wrap break-words">
        To: {to}
      </div>
      {value &&
        <div className="w-full p-4 border border-contrast rounded-xl whitespace-pre-wrap mt-2 break-words">
          Value: {BigInts.float(BigInts.parse(value), 18)}
        </div>}
      {data &&
        <div className="grow w-full p-4 border border-contrast rounded-xl whitespace-pre-wrap mt-2 break-words">
          Data: {data}
        </div>}
    </div>
    <div className="p-4 w-full flex items-center gap-2">
      <Button.Contrast className="grow po-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onReject.run}
        disabled={onReject.loading}>
        <Button.Shrink>
          <Outline.XMarkIcon className="s-sm" />
          No, reject it
        </Button.Shrink>
      </Button.Contrast>
      <Button.Gradient className="grow po-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onApprove.run}
        disabled={loading}
        colorIndex={5}>
        <Button.Shrink>
          <Outline.CheckIcon className="s-sm" />
          Yes, approve it
        </Button.Shrink>
      </Button.Gradient>
    </div>
  </Page>
}

export function SwitchPage() {
  const { searchParams } = usePath()
  const core = useCore().unwrap()
  const storage = useUserStorage().unwrap()
  const background = useBackground()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcOk(id, undefined)]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = await AppRequests.get(storage).make(core)

      if (requestsQuery.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [core, storage, background, id])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = await AppRequests.get(storage).make(core)

      if (requestsQuery.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [core, storage, background, id])

  return <Page>
    <div className="p-4 grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Switch chain
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        Do you want to switch the Ethereum chain?
      </div>
    </div>
    <div className="p-4 w-full flex items-center gap-2">
      <Button.Contrast className="grow po-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onReject.run}
        disabled={onReject.loading}>
        <Button.Shrink>
          <Outline.XMarkIcon className="s-sm" />
          No, reject it
        </Button.Shrink>
      </Button.Contrast>
      <Button.Gradient className="grow po-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onApprove.run}
        disabled={onApprove.loading}
        colorIndex={5}>
        <Button.Shrink>
          <Outline.CheckIcon className="s-sm" />
          Yes, approve it
        </Button.Shrink>
      </Button.Gradient>
    </div>
  </Page>
}

export function PersonalSignPage() {
  const { searchParams } = usePath()
  const core = useCore().unwrap()
  const storage = useUserStorage().unwrap()
  const background = useBackground()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const requestQuery = useAppRequest(id)
  const maybeRequest = requestQuery.data?.inner

  const sessionQuery = useTemporarySession(maybeRequest?.session)
  const maybeSession = sessionQuery.data?.inner

  const walletQuery = useWallet(maybeSession?.wallets.at(0)?.uuid)
  const maybeWallet = walletQuery.data?.inner

  const message = Option.wrap(searchParams.get("message")).unwrap()

  const userMessage = useMemo(() => {
    return message.startsWith("0x")
      ? Bytes.toUtf8(Bytes.fromHexSafe(message.slice(2)))
      : message
  }, [message])

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const wallet = Option.wrap(maybeWallet).ok().throw(t)

      if (wallet.type === "readonly")
        return new Err(new Error(`This wallet is readonly`))

      const privateKey = await Wallets.tryGetPrivateKey(wallet, background).then(r => r.throw(t))

      const ewallet = Ethers.Wallet.tryFrom(privateKey).throw(t)

      const signature = await Result.catchAndWrap(async () => {
        return await ewallet.signMessage(userMessage)
      }).then(r => r.throw(t))

      await background.tryRequest({
        method: "popup_data",
        params: [new RpcOk(id, signature)]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = await AppRequests.get(storage).make(core)

      if (requestsQuery.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [core, storage, background, id, maybeWallet, userMessage])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = await AppRequests.get(storage).make(core)

      if (requestsQuery.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [core, storage, background, id])

  return <Page>
    <div className="p-4 grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Sign message
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        Do you want to sign the following message?
      </div>
    </div>
    <div className="w-full p-4 grow">
      <div className="h-full w-full p-4 border border-contrast rounded-xl whitespace-pre-wrap break-words">
        {userMessage}
      </div>
    </div>
    <div className="p-4 w-full flex items-center gap-2">
      <Button.Contrast className="grow po-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onReject.run}
        disabled={onReject.loading}>
        <Button.Shrink>
          <Outline.XMarkIcon className="s-sm" />
          No, reject it
        </Button.Shrink>
      </Button.Contrast>
      <Button.Gradient className="grow po-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onApprove.run}
        disabled={onApprove.loading}
        colorIndex={5}>
        <Button.Shrink>
          <Outline.CheckIcon className="s-sm" />
          Yes, approve it
        </Button.Shrink>
      </Button.Gradient>
    </div>
  </Page>
}

export function TypedSignPage() {
  const { searchParams } = usePath()
  const core = useCore().unwrap()
  const storage = useUserStorage().unwrap()
  const background = useBackground()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const requestQuery = useAppRequest(id)
  const maybeRequest = requestQuery.data?.inner

  const sessionQuery = useTemporarySession(maybeRequest?.session)
  const maybeSession = sessionQuery.data?.inner

  const walletQuery = useWallet(maybeSession?.wallets.at(0)?.uuid)
  const maybeWallet = walletQuery.data?.inner

  const data = Option.wrap(searchParams.get("data")).unwrap()

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const wallet = Option.wrap(maybeWallet).ok().throw(t)

      const { domain, types, message } = JSON.parse(data)

      if (wallet.type === "readonly")
        return new Err(new Error(`This wallet is readonly`))

      const privateKey = await Wallets.tryGetPrivateKey(wallet, background).then(r => r.throw(t))

      const ewallet = Ethers.Wallet.tryFrom(privateKey).throw(t)

      const signature = await Result.catchAndWrap(async () => {
        delete types["EIP712Domain"]

        return await ewallet.signTypedData(domain, types, message)
      }).then(r => r.throw(t))

      await background.tryRequest({
        method: "popup_data",
        params: [new RpcOk(id, signature)]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = await AppRequests.get(storage).make(core)

      if (requestsQuery.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [core, storage, background, id, maybeWallet, data])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = await AppRequests.get(storage).make(core)

      if (requestsQuery.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [core, storage, background, id])

  return <Page>
    <div className="p-4 grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Sign message
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        Do you want to sign the following message?
      </div>
    </div>
    <div className="w-full p-4 grow">
      <div className="h-full w-full p-4 border border-contrast rounded-xl whitespace-pre-wrap break-words">
        {JSON.stringify(JSON.parse(data))}
      </div>
    </div>
    <div className="p-4 w-full flex items-center gap-2">
      <Button.Contrast className="grow po-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onReject.run}
        disabled={onReject.loading}>
        <Button.Shrink>
          <Outline.XMarkIcon className="s-sm" />
          No, reject it
        </Button.Shrink>
      </Button.Contrast>
      <Button.Gradient className="grow po-md hovered-or-clicked-or-focused:scale-105 transition"
        onClick={onApprove.run}
        disabled={onApprove.loading}
        colorIndex={5}>
        <Button.Shrink>
          <Outline.CheckIcon className="s-sm" />
          Yes, approve it
        </Button.Shrink>
      </Button.Gradient>
    </div>
  </Page>
}

export function WalletAndChainSelectPage() {
  const { searchParams } = usePath()
  const core = useCore().unwrap()
  const storage = useUserStorage().unwrap()
  const background = useBackground()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const wallets = useWallets()

  const creator = useBooleanHandle(false)

  const [persistent, setPersistent] = useState(true)

  const onPersistentChange = useInputChange(e => {
    setPersistent(e.currentTarget.checked)
  }, [])

  const [chain, setChain] = useState<number>(1)

  const onWalletClick = useAsyncUniqueCallback(async (wallet: Wallet) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "popup_data",
        params: [new RpcOk(id, [persistent, wallet.uuid, chain])]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = await AppRequests.get(storage).make(core)

      if (requestsQuery.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [core, storage, background, id, chain, persistent])

  const Body =
    <PageBody>
      <div className="flex flex-wrap items-center gap-1">
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === 1}
          onClick={() => setChain(1)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            Ethereum
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === 137}
          onClick={() => setChain(137)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            Polygon
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === 5}
          onClick={() => setChain(5)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            Goerli
          </Button.Shrink>
        </Button.Bordered>
      </div>
      <div className="h-4" />
      <label>
        <input type="checkbox"
          checked={persistent}
          onChange={onPersistentChange} />
        <span className="px-1">
          Keep me connected
        </span>
      </label>
      <div className="h-4" />
      <ClickableWalletGrid
        ok={onWalletClick.run}
        create={creator.enable}
        wallets={wallets.data?.inner} />
    </PageBody>

  const Header =
    <PageHeader title="Choose a wallet">
      <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
        onClick={creator.enable}>
        <Outline.PlusIcon className="s-sm" />
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
  return <Page>
    <div className="p-4 grow flex flex-col items-center justify-center">
      <div className="text-center text-xl font-medium">
        Done
      </div>
      <div className="w-full max-w-[230px] text-center text-contrast">
        You can now close this window or continue using it
      </div>
    </div>
  </Page>
}