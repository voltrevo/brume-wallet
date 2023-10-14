import { BigIntToHex, BigInts } from "@/libs/bigints/bigints";
import { chainByChainId, chainIdByName } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header";
import { Page } from "@/mods/foreground/components/page/page";
import { FgAppRequests } from "@/mods/foreground/entities/requests/all/data";
import { useAppRequest } from "@/mods/foreground/entities/requests/data";
import { useSession } from "@/mods/foreground/entities/sessions/data";
import { UserProvider } from "@/mods/foreground/entities/users/context";
import { WalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create";
import { useWallets } from "@/mods/foreground/entities/wallets/all/data";
import { ClickableWalletGrid } from "@/mods/foreground/entities/wallets/all/page";
import { EthereumWalletInstance, useEthereumContext, useGasPrice, useNonce, useWallet } from "@/mods/foreground/entities/wallets/data";
import { UserRejectionError } from "@/mods/foreground/errors/errors";
import { Bottom } from "@/mods/foreground/overlay/bottom";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { Path, usePath } from "@/mods/foreground/router/path/context";
import { Router } from "@/mods/foreground/router/router";
import { useUserStorage } from "@/mods/foreground/storage/user";
import { Base16 } from "@hazae41/base16";
import { Bytes } from "@hazae41/bytes";
import { Abi } from "@hazae41/cubane";
import { RpcErr, RpcOk } from "@hazae41/jsonrpc";
import { Option } from "@hazae41/option";
import { Err, Ok, Result } from "@hazae41/result";
import { Transaction } from "ethers";
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
  const background = useBackground().unwrap()

  useEffect(() => {
    background
      .tryRequest<void>({ method: "popup_hello" })
      .then(r => r.unwrap().unwrap())
  }, [background])

  return <>
    <Router />
    <Bottom />
  </>
}

export function TransactPage() {
  const { searchParams } = usePath()
  const storage = useUserStorage().unwrap()
  const background = useBackground().unwrap()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const requestQuery = useAppRequest(id)
  const maybeRequest = requestQuery.data?.inner

  const sessionQuery = useSession(maybeRequest?.session)
  const maybeSession = sessionQuery.data?.inner

  const walletQuery = useWallet(maybeSession?.wallets.at(0)?.uuid)
  const maybeWallet = walletQuery.data?.inner

  const from = Option.wrap(searchParams.get("from")).unwrap()
  const to = Option.wrap(searchParams.get("to")).unwrap()
  const gas = Option.wrap(searchParams.get("gas")).unwrap()

  const chainId = Option.wrap(searchParams.get("chainId")).mapSync(Number).unwrap()
  const chain = Option.wrap(chainByChainId[chainId]).unwrap()

  const value = searchParams.get("value")
  const data = searchParams.get("data")

  const context = useEthereumContext(maybeSession?.wallets.at(0)?.uuid, chain)

  const gasPriceQuery = useGasPrice(context)
  const maybeGasPrice = gasPriceQuery.data?.inner

  const nonceQuery = useNonce(maybeWallet?.address, context)
  const maybeNonce = nonceQuery.data?.inner

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const wallet = Option.wrap(maybeWallet).ok().throw(t)
      const gasPrice = Option.wrap(maybeGasPrice).ok().throw(t)
      const nonce = Option.wrap(maybeNonce).ok().throw(t)

      const tx = Result.runAndDoubleWrapSync(() => {
        return Transaction.from({
          data: data,
          to: to,
          gasLimit: gas,
          chainId: chain.chainId,
          gasPrice: gasPrice,
          nonce: Number(nonce),
          value: value
        })
      }).throw(t)

      const instance = await EthereumWalletInstance.tryFrom(wallet, background).then(r => r.throw(t))
      tx.signature = await instance.trySignTransaction(tx, background).then(r => r.throw(t))

      await background.tryRequest({
        method: "brume_respond",
        params: [new RpcOk(id, tx.serialized)]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = FgAppRequests.schema(storage)
      const requestsState = await requestsQuery.state.then(r => r.throw(t))

      if (requestsState.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [storage, background, id, maybeWallet, maybeGasPrice, maybeNonce, chain])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "brume_respond",
        params: [RpcErr.rewrap(id, new Err(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = FgAppRequests.schema(storage)
      const requestsState = await requestsQuery.state.then(r => r.throw(t))

      if (requestsState.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [storage, background, id])

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
          Value: {BigIntToHex.tryDecode(value).mapSync(x => BigInts.float(x, 18)).ok().unwrapOr("Error")}
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
  const storage = useUserStorage().unwrap()
  const background = useBackground().unwrap()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "brume_respond",
        params: [new RpcOk(id, undefined)]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = FgAppRequests.schema(storage)
      const requestsState = await requestsQuery.state.then(r => r.throw(t))

      if (requestsState.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [storage, background, id])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "brume_respond",
        params: [RpcErr.rewrap(id, new Err(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = FgAppRequests.schema(storage)
      const requestsState = await requestsQuery.state.then(r => r.throw(t))

      if (requestsState.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [storage, background, id])

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
  const storage = useUserStorage().unwrap()
  const background = useBackground().unwrap()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const requestQuery = useAppRequest(id)
  const maybeRequest = requestQuery.data?.inner

  const sessionQuery = useSession(maybeRequest?.session)
  const maybeSession = sessionQuery.data?.inner

  const walletQuery = useWallet(maybeSession?.wallets.at(0)?.uuid)
  const maybeWallet = walletQuery.data?.inner

  const message = Option.wrap(searchParams.get("message")).unwrap()

  const userMessage = useMemo(() => {
    return message.startsWith("0x")
      ? Bytes.toUtf8(Base16.get().tryPadStartAndDecode(message.slice(2)).unwrap().copyAndDispose())
      : message
  }, [message])

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const wallet = Option.wrap(maybeWallet).ok().throw(t)

      const instance = await EthereumWalletInstance.tryFrom(wallet, background).then(r => r.throw(t))
      const signature = await instance.trySignPersonalMessage(userMessage, background).then(r => r.throw(t))

      await background.tryRequest({
        method: "brume_respond",
        params: [new RpcOk(id, signature)]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = FgAppRequests.schema(storage)
      const requestsState = await requestsQuery.state.then(r => r.throw(t))

      if (requestsState.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [storage, background, id, maybeWallet, userMessage])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "brume_respond",
        params: [RpcErr.rewrap(id, new Err(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = FgAppRequests.schema(storage)
      const requestsState = await requestsQuery.state.then(r => r.throw(t))

      if (requestsState.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [storage, background, id])

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
  const storage = useUserStorage().unwrap()
  const background = useBackground().unwrap()

  const id = Option.wrap(searchParams.get("id")).unwrap()

  const requestQuery = useAppRequest(id)
  const maybeRequest = requestQuery.data?.inner

  const sessionQuery = useSession(maybeRequest?.session)
  const maybeSession = sessionQuery.data?.inner

  const walletQuery = useWallet(maybeSession?.wallets.at(0)?.uuid)
  const maybeWallet = walletQuery.data?.inner

  const data = Option.wrap(searchParams.get("data")).unwrap()

  const onApprove = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const wallet = Option.wrap(maybeWallet).ok().throw(t)

      const typed = JSON.parse(data) as Abi.Typed.TypedData

      const instance = await EthereumWalletInstance.tryFrom(wallet, background).then(r => r.throw(t))
      const signature = await instance.trySignEIP712HashedMessage(typed, background).then(r => r.throw(t))

      await background.tryRequest({
        method: "brume_respond",
        params: [new RpcOk(id, signature)]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = FgAppRequests.schema(storage)
      const requestsState = await requestsQuery.state.then(r => r.throw(t))

      if (requestsState.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [storage, background, id, maybeWallet, data])

  const onReject = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      await background.tryRequest({
        method: "brume_respond",
        params: [RpcErr.rewrap(id, new Err(new UserRejectionError()))]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = FgAppRequests.schema(storage)
      const requestsState = await requestsQuery.state.then(r => r.throw(t))

      if (requestsState.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [storage, background, id])

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
  const storage = useUserStorage().unwrap()
  const background = useBackground().unwrap()

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
        method: "brume_respond",
        params: [new RpcOk(id, [persistent, wallet.uuid, chain])]
      }).then(r => r.throw(t).throw(t))

      const requestsQuery = FgAppRequests.schema(storage)
      const requestsState = await requestsQuery.state.then(r => r.throw(t))

      if (requestsState.data?.inner.length)
        Path.go("/requests")
      else
        Path.go("/done")

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [storage, background, id, chain, persistent])

  const Body =
    <PageBody>
      <div className="flex flex-wrap items-center gap-1">
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.ETHEREUM].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.ETHEREUM].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.ETHEREUM].name}
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.GNOSIS].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.GNOSIS].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.GNOSIS].name}
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.POLYGON].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.POLYGON].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.POLYGON].name}
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.BINANCE].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.BINANCE].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.BINANCE].name}
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.ARBITRUM].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.ARBITRUM].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.ARBITRUM].name}
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.ZKSYNC].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.ZKSYNC].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.ZKSYNC].name}
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.AVALANCHE].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.AVALANCHE].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.AVALANCHE].name}
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.CELO].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.CELO].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.CELO].name}
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.LINEA].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.LINEA].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.LINEA].name}
          </Button.Shrink>
        </Button.Bordered>
        <Button.Bordered className="po-sm hovered-or-clicked-or-focused:scale-105 transition"
          aria-selected={chain === chainByChainId[chainIdByName.BASE].chainId}
          onClick={() => setChain(chainByChainId[chainIdByName.BASE].chainId)}>
          <Button.Shrink>
            <Outline.CubeIcon className="s-xs" />
            {chainByChainId[chainIdByName.BASE].name}
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
        maybeWallets={wallets.data?.inner} />
    </PageBody>

  const Header =
    <PageHeader title="Choose a wallet">
      <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
        onClick={creator.enable}>
        <Button.Shrink>
          <Outline.PlusIcon className="s-sm" />
        </Button.Shrink>
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