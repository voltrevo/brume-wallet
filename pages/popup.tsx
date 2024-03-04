import { Errors, UIError } from "@/libs/errors/errors";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { Dialog, Dialog2 } from "@/libs/ui/dialog/dialog";
import { Menu } from "@/libs/ui2/menu/menu";
import { PageBody, UserPageHeader } from "@/libs/ui2/page/header";
import { Page } from "@/libs/ui2/page/page";
import { qurl } from "@/libs/url/url";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { useAppRequests } from "@/mods/foreground/entities/requests/data";
import { useSimulation } from "@/mods/foreground/entities/simulations/data";
import { useTransactionTrial, useTransactionWithReceipt } from "@/mods/foreground/entities/transactions/data";
import { SmallShrinkableOppositeAnchor, useGenius } from "@/mods/foreground/entities/users/all/page";
import { WalletTransactionDialog } from "@/mods/foreground/entities/wallets/actions/eth_sendTransaction";
import { PaddedRoundedShrinkableNakedAnchor, WideShrinkableContrastButton, WideShrinkableOppositeButton } from "@/mods/foreground/entities/wallets/actions/send";
import { WalletCreatorMenu } from "@/mods/foreground/entities/wallets/all/create";
import { ReadonlyWalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create/readonly";
import { StandaloneWalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create/standalone";
import { SelectableWalletGrid } from "@/mods/foreground/entities/wallets/all/page";
import { WalletDataContext } from "@/mods/foreground/entities/wallets/context";
import { EthereumWalletInstance, useEthereumContext2, useWallet, useWallets } from "@/mods/foreground/entities/wallets/data";
import { UserRejectedError } from "@/mods/foreground/errors/errors";
import { NavBar } from "@/mods/foreground/overlay/navbar";
import { Overlay } from "@/mods/foreground/overlay/overlay";
import { HashSubpathProvider, useHashSubpath, usePathContext } from "@/mods/foreground/router/path/context";
import { Router } from "@/mods/foreground/router/router";
import { Base16 } from "@hazae41/base16";
import { Bytes } from "@hazae41/bytes";
import { Abi, Address } from "@hazae41/cubane";
import { RpcErr, RpcOk } from "@hazae41/jsonrpc";
import { Nullable, Option } from "@hazae41/option";
import { Err, Result } from "@hazae41/result";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Popup() {
  const background = useBackgroundContext().unwrap()

  useEffect(() => {
    background.requestOrThrow<void>({
      method: "popup_hello"
    }).then(r => r.unwrap())
  }, [background])

  const [loading, setLoading] = useState(false)

  useMemo(() => {
    if (location.hash !== "")
      return

    background.requestOrThrow<string>({
      method: "brume_getPath"
    }).then(r => {
      location.hash = r.unwrap()
      setLoading(false)
    })

    setLoading(true)
  }, [background])

  useEffect(() => {
    const onHashChange = () => void background.requestOrThrow<void>({
      method: "brume_setPath",
      params: [location.hash]
    }).then(r => r.unwrap())

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [background])

  if (loading)
    return null

  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden">
    <NavBar />
    <Overlay>
      <Router />
    </Overlay>
  </main>
}

export function TransactPage() {
  const path = usePathContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const subpath = useHashSubpath(path)

  const id = Option.unwrap(path.url.searchParams.get("id"))

  const walletId = Option.unwrap(path.url.searchParams.get("walletId"))
  const walletQuery = useWallet(walletId)
  const maybeWallet = walletQuery.current?.ok().get()

  const chainId = Option.unwrap(path.url.searchParams.get("chainId"))
  const chainData = Option.unwrap(chainByChainId[Number(chainId)])

  const maybeContext = useEthereumContext2(maybeWallet?.uuid, chainData).get()

  const from = Option.unwrap(path.url.searchParams.get("from"))
  const maybeTo = path.url.searchParams.get("to")
  const maybeGas = path.url.searchParams.get("gas")
  const maybeValue = path.url.searchParams.get("value")
  const maybeNonce = path.url.searchParams.get("nonce")
  const maybeData = path.url.searchParams.get("data")
  const maybeGasPrice = path.url.searchParams.get("gasPrice")
  const maybeMaxFeePerGas = path.url.searchParams.get("maxFeePerGas")
  const maybeMaxPriorityFeePerGas = path.url.searchParams.get("maxPriorityFeePerGas")

  const trialQuery = useTransactionTrial(id)
  const maybeTrialData = trialQuery.current?.ok().get()

  const transactionQuery = useTransactionWithReceipt(maybeTrialData?.transactions[0].uuid, maybeContext)
  const maybeTransaction = transactionQuery.current?.ok().get()

  const preTx = useMemo(() => {
    return {
      from: from,
      to: maybeTo,
      gas: maybeGas,
      value: maybeValue,
      data: maybeData,
      nonce: maybeNonce,
      gasPrice: maybeGasPrice,
      maxFeePerGas: maybeMaxFeePerGas,
      maxPriorityFeePerGas: maybeMaxPriorityFeePerGas
    }
  }, [from, maybeTo, maybeValue, maybeNonce, maybeData, maybeGas, maybeGasPrice, maybeMaxFeePerGas, maybeMaxPriorityFeePerGas])

  const simulationQuery = useSimulation(preTx, "pending", maybeContext)
  const maybeSimulation = simulationQuery.current?.ok().get()

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    const transaction = Option.unwrap(maybeTransaction)

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, transaction.hash)]
    }).then(r => r.unwrap())

    location.replace(path.go("/done"))
  }), [background, id, path, maybeTransaction])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.unwrap())

    location.replace(path.go("/done"))
  }), [background, id, path])

  const onSendTransactionClick = useCallback(() => {
    location.replace(subpath.go(qurl("/eth_sendTransaction", { trial: id, chain: chainId, target: maybeTo, value: maybeValue, nonce: maybeNonce, data: maybeData, gas: maybeGas, gasMode: "custom", gasPrice: maybeGasPrice, maxFeePerGas: maybeMaxFeePerGas, maxPriorityFeePerGas: maybeMaxPriorityFeePerGas, disableData: true, disableSign: true })))
  }, [subpath, id, chainId, maybeTo, maybeValue, maybeNonce, maybeData, maybeGas, maybeGasPrice, maybeMaxFeePerGas, maybeMaxPriorityFeePerGas])

  useEffect(() => {
    if (maybeTransaction == null)
      return
    approveOrAlert.run()
  }, [maybeTransaction, approveOrAlert])

  return <WalletDataContext.Provider value={maybeWallet}>
    <Page>
      <HashSubpathProvider>
        {subpath.url.pathname === "/eth_sendTransaction" &&
          <Dialog2>
            <WalletTransactionDialog />
          </Dialog2>}
      </HashSubpathProvider>
      <PageBody>
        <Dialog.Title>
          Transaction
        </Dialog.Title>
        <div className="h-2" />
        <div className="text-contrast">
          Do you want to send the following transaction?
        </div>
        <div className="h-4" />
        <div className="p-4 bg-contrast rounded-xl whitespace-pre-wrap break-words">
          {JSON.stringify(preTx, undefined, 2)}
        </div>
        {maybeSimulation != null && <>
          <div className="h-4" />
          <div className="p-4 bg-contrast rounded-xl flex flex-col gap-2">
            {maybeSimulation.logs.map((log, i) =>
              <div className="p-2 bg-contrast rounded-xl flex flex-col gap-2"
                key={i}>
                <div className="whitespace-pre-wrap break-words">
                  {log.name} ({Address.tryFrom(log.raw.address).mapSync(Address.format).ok().get()})
                </div>
                {log.inputs.map((input, j) =>
                  <div className="p-2 bg-contrast rounded-xl whitespace-pre-wrap break-words"
                    key={j}>
                    {input.type} {input.name} {JSON.stringify(input.value)}
                  </div>)}
              </div>)}
          </div>
        </>}
        <div className="h-4 grow" />
        <div className="flex items-center flex-wrap-reverse gap-2">
          <WideShrinkableContrastButton
            onClick={rejectOrAlert.run}
            disabled={rejectOrAlert.loading}>
            <Outline.XMarkIcon className="size-5" />
            Reject
          </WideShrinkableContrastButton>
          <WideShrinkableOppositeButton
            onClick={onSendTransactionClick}>
            <Outline.CheckIcon className="size-5" />
            Transact
          </WideShrinkableOppositeButton>
        </div>
      </PageBody>
    </Page>
  </WalletDataContext.Provider>
}

export function PersonalSignPage() {
  const path = usePathContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const id = Option.unwrap(path.url.searchParams.get("id"))

  const walletId = Option.unwrap(path.url.searchParams.get("walletId"))
  const walletQuery = useWallet(walletId)
  const maybeWallet = walletQuery.current?.ok().get()

  const message = Option.unwrap(path.url.searchParams.get("message"))

  const triedUserMessage = useMemo(() => Result.runAndWrapSync(() => {
    return message.startsWith("0x")
      ? Bytes.toUtf8(Base16.get().padStartAndDecodeOrThrow(message.slice(2)).copyAndDispose())
      : message
  }), [message])

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    const wallet = Option.unwrap(maybeWallet)
    const message = triedUserMessage.unwrap()

    const instance = await EthereumWalletInstance.tryFrom(wallet, background).then(r => r.unwrap())
    const signature = await instance.trySignPersonalMessage(message, background).then(r => r.unwrap())

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, signature)]
    }).then(r => r.unwrap())

    location.replace(path.go("/done"))
  }), [background, id, path, maybeWallet, triedUserMessage])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.unwrap())

    location.replace(path.go("/done"))
  }), [background, id, path])

  return <Page>
    <PageBody>
      <Dialog.Title>
        Signature
      </Dialog.Title>
      <div className="h-2" />
      <div className="text-contrast">
        Do you want to sign the following message?
      </div>
      <div className="h-2" />
      <div className="text-contrast">
        Some applications may ask you to sign a message to prove you own a specific address or to approve a specific action without doing a transaction.
      </div>
      <div className="h-4" />
      <div className="grow p-4 bg-contrast rounded-xl whitespace-pre-wrap break-words">
        {triedUserMessage.unwrapOr("Could not decode message")}
      </div>
      <div className="h-4 grow" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableContrastButton
          onClick={rejectOrAlert.run}
          disabled={rejectOrAlert.loading}>
          <Outline.XMarkIcon className="size-5" />
          Reject
        </WideShrinkableContrastButton>
        <WideShrinkableOppositeButton
          onClick={approveOrAlert.run}
          disabled={approveOrAlert.loading}>
          <Outline.CheckIcon className="size-5" />
          Approve
        </WideShrinkableOppositeButton>
      </div>
    </PageBody>
  </Page>
}

export function TypedSignPage() {
  const path = usePathContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const id = Option.unwrap(path.url.searchParams.get("id"))

  const walletId = Option.unwrap(path.url.searchParams.get("walletId"))
  const walletQuery = useWallet(walletId)
  const maybeWallet = walletQuery.current?.ok().get()

  const data = Option.unwrap(path.url.searchParams.get("data"))

  const triedParsedData = useMemo(() => Result.runAndWrapSync(() => {
    return JSON.parse(data) as Abi.Typed.TypedData
  }), [data])

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    const wallet = Option.unwrap(maybeWallet)
    const data = triedParsedData.unwrap()

    const instance = await EthereumWalletInstance.tryFrom(wallet, background).then(r => r.unwrap())
    const signature = await instance.trySignEIP712HashedMessage(data, background).then(r => r.unwrap())

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, signature)]
    }).then(r => r.unwrap())

    location.replace(path.go("/done"))
  }), [background, id, path, maybeWallet, triedParsedData])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.unwrap())

    location.replace(path.go("/done"))
  }), [background, id, path])

  return <Page>
    <PageBody>
      <Dialog.Title>
        Signature
      </Dialog.Title>
      <div className="h-2" />
      <div className="text-contrast">
        Do you want to sign the following message?
      </div>
      <div className="h-2" />
      <div className="text-contrast">
        Some applications may ask you to sign a message to prove you own a specific address or to approve a specific action without doing a transaction.
      </div>
      <div className="h-4" />
      <div className="grow p-4 bg-contrast rounded-xl whitespace-pre-wrap break-words">
        {triedParsedData.mapSync(x => JSON.stringify(x, undefined, 2)).unwrapOr("Could not decode message")}
      </div>
      <div className="h-4 grow" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableContrastButton
          onClick={rejectOrAlert.run}
          disabled={rejectOrAlert.loading}>
          <Outline.XMarkIcon className="size-5" />
          Reject
        </WideShrinkableContrastButton>
        <WideShrinkableOppositeButton
          onClick={approveOrAlert.run}
          disabled={approveOrAlert.loading}>
          <Outline.CheckIcon className="size-5" />
          Approve
        </WideShrinkableOppositeButton>
      </div>
    </PageBody>
  </Page>
}

export function WalletAndChainSelectPage() {
  const path = usePathContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const subpath = useHashSubpath(path)
  const creator = useGenius(subpath, "/create")

  const id = Option.unwrap(path.url.searchParams.get("id"))

  const wallets = useWallets()

  const [persistent, setPersistent] = useState(true)

  const onPersistentChange = useInputChange(e => {
    setPersistent(e.currentTarget.checked)
  }, [])

  const [selecteds, setSelecteds] = useState<Nullable<Wallet>[]>([])

  const onWalletClick = useCallback((wallet: Wallet) => {
    const clone = new Set(selecteds)

    if (clone.has(wallet))
      clone.delete(wallet)
    else
      clone.add(wallet)

    setSelecteds([...clone])
  }, [selecteds])

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (selecteds.length === 0)
      throw new UIError(`No wallet selected`)

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, [persistent, 1, selecteds])]
    }).then(r => r.unwrap())

    location.replace(path.go("/done"))
  }), [background, id, path, selecteds, persistent])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.unwrap())

    location.replace(path.go("/done"))
  }), [background, id, path])

  const Header =
    <UserPageHeader title="Connect">
      <PaddedRoundedShrinkableNakedAnchor
        onKeyDown={creator.onKeyDown}
        onClick={creator.onClick}
        href={creator.href}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedShrinkableNakedAnchor>
    </UserPageHeader>

  const Body =
    <PageBody>
      <SelectableWalletGrid
        wallets={wallets.data?.get()}
        ok={onWalletClick}
        selecteds={selecteds} />
      <div className="h-4" />
      <label className="po-md flex items-center bg-contrast rounded-xl">
        <div className="shrink-0">
          Stay connected
        </div>
        <div className="w-4 grow" />
        <input className="bg-transparent outline-none min-w-0 disabled:text-contrast"
          type="checkbox"
          checked={persistent}
          onChange={onPersistentChange} />
      </label>
      <div className="h-4" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableContrastButton
          onClick={rejectOrAlert.run}
          disabled={rejectOrAlert.loading}>
          <Outline.XMarkIcon className="size-5" />
          Reject
        </WideShrinkableContrastButton>
        <WideShrinkableOppositeButton
          onClick={approveOrAlert.run}
          disabled={approveOrAlert.loading}>
          <Outline.CheckIcon className="size-5" />
          Approve
        </WideShrinkableOppositeButton>
      </div>
    </PageBody>

  return <Page>
    <HashSubpathProvider>
      {subpath.url.pathname === "/create" &&
        <Menu>
          <WalletCreatorMenu />
        </Menu>}
      {subpath.url.pathname === "/create/standalone" &&
        <Dialog2>
          <StandaloneWalletCreatorDialog />
        </Dialog2>}
      {subpath.url.pathname === "/create/readonly" &&
        <Dialog2>
          <ReadonlyWalletCreatorDialog />
        </Dialog2>}
    </HashSubpathProvider>
    {Header}
    {Body}
  </Page>
}

export function DonePage() {
  const path = usePathContext().unwrap()
  const requests = useAppRequests().current?.ok().get()

  useEffect(() => {
    if (!requests?.length)
      return
    location.replace(path.go("/requests"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests])

  return <Page>
    <PageBody>
      <Dialog.Title>
        Done
      </Dialog.Title>
      <div className="h-2" />
      <div className="text-contrast">
        You can now close this window or continue to use it
      </div>
      <div className="h-4" />
      <div className="grow flex flex-col items-center justify-center">
        <SmallShrinkableOppositeAnchor
          href="#/home">
          <Outline.HomeIcon className="size-5" />
          Home
        </SmallShrinkableOppositeAnchor>
      </div>
    </PageBody>
  </Page>
}