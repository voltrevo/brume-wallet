import { browser, BrowserError } from "@/libs/browser/browser";
import { Errors, UIError } from "@/libs/errors/errors";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { UserRejectedError } from "@/libs/rpc/mods/errors";
import { ClickableOppositeAnchor, PaddedRoundedClickableNakedAnchor } from "@/libs/ui/anchor";
import { WideClickableContrastButton, WideClickableOppositeButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastLabel } from "@/libs/ui/label";
import { Menu } from "@/libs/ui/menu";
import { PageBody, UserPageHeader } from "@/libs/ui/page/header";
import { UserPage } from "@/libs/ui/page/page";
import { urlOf } from "@/libs/url/url";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { useAppRequests } from "@/mods/foreground/entities/requests/data";
import { useSimulation } from "@/mods/foreground/entities/simulations/data";
import { useTransactionTrial, useTransactionWithReceipt } from "@/mods/foreground/entities/transactions/data";
import { WalletTransactionDialog } from "@/mods/foreground/entities/wallets/actions/eth_sendTransaction";
import { SimpleInput, SimpleTextarea } from "@/mods/foreground/entities/wallets/actions/send";
import { WalletCreatorMenu } from "@/mods/foreground/entities/wallets/all/create";
import { ReadonlyWalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create/readonly";
import { StandaloneWalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create/standalone";
import { SelectableWalletGrid } from "@/mods/foreground/entities/wallets/all/page";
import { WalletDataContext } from "@/mods/foreground/entities/wallets/context";
import { EthereumWalletInstance, useEthereumContext, useWallet, useWallets } from "@/mods/foreground/entities/wallets/data";
import { NavBar } from "@/mods/foreground/overlay/navbar";
import { Base16 } from "@hazae41/base16";
import { Bytes } from "@hazae41/bytes";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { Abi } from "@hazae41/cubane";
import { RpcErr, RpcOk } from "@hazae41/jsonrpc";
import { Nullable, Option } from "@hazae41/option";
import { Err, Result } from "@hazae41/result";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Main() {
  const background = useBackgroundContext().getOrThrow()

  const helloOrThrow = useCallback(async () => {
    await background.requestOrThrow<void>({
      method: "popup_hello"
    }).then(r => r.getOrThrow())
  }, [background])

  useEffect(() => {
    helloOrThrow().catch(console.error)
  }, [helloOrThrow])

  const getHashOrThrow = useCallback(async () => {
    return await background.requestOrThrow<string>({
      method: "brume_getPath"
    }).then(r => r.getOrThrow())
  }, [background])

  const setHashOrThrow = useCallback(async (hash: string) => {
    await background.requestOrThrow<void>({
      method: "brume_setPath",
      params: [hash]
    }).then(r => r.getOrThrow())
  }, [background])

  const [hash, setHash] = useState<string>()

  useEffect(() => {
    const onHashChange = () => setHash(location.hash)
    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    if (hash == null)
      return
    location.hash = hash
  }, [hash])

  const initHashOrThrow = useCallback(async () => {
    if (location.hash && location.hash !== "#/")
      setHash(location.hash)
    else
      setHash(await getHashOrThrow())
  }, [getHashOrThrow])

  useEffect(() => {
    initHashOrThrow().catch(console.error)
  }, [initHashOrThrow])

  useEffect(() => {
    if (hash == null)
      return
    setHashOrThrow(hash).catch(console.error)
  }, [setHashOrThrow, hash])

  const url = useMemo(() => {
    if (hash == null)
      return
    const url = new URL(BrowserError.runOrThrowSync(() => browser!.runtime.getURL("/index.html")))
    url.hash = hash
    return url
  }, [hash])

  const [iframe, setIframe] = useState<Nullable<HTMLIFrameElement>>()

  const subwindow = useMemo(() => {
    if (iframe == null)
      return
    if (iframe.contentWindow == null)
      return
    return iframe.contentWindow
  }, [iframe])

  useEffect(() => {
    if (subwindow == null)
      return
    const onSubwindowHashChange = () => setHash(subwindow.location.hash)
    subwindow.addEventListener("hashchange", onSubwindowHashChange, { passive: true })
    return () => subwindow.removeEventListener("hashchange", onSubwindowHashChange)
  }, [subwindow])

  if (url == null)
    return null

  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
    <NavBar />
    <iframe className="grow w-full"
      ref={setIframe}
      src={url.href}
      seamless />
  </main>
}

export function TransactPage() {
  const path = usePathContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const subpath = useHashSubpath(path)

  const id = Option.wrap(path.url.searchParams.get("id")).getOrThrow()

  const walletId = Option.wrap(path.url.searchParams.get("walletId")).getOrThrow()
  const walletQuery = useWallet(walletId)
  const maybeWallet = walletQuery.current?.getOrNull()

  const chainId = Option.wrap(path.url.searchParams.get("chainId")).getOrThrow()
  const chainData = Option.wrap(chainDataByChainId[Number(chainId)]).getOrThrow()

  const maybeContext = useEthereumContext(maybeWallet?.uuid, chainData).getOrNull()

  const from = Option.wrap(path.url.searchParams.get("from")).getOrThrow()
  const maybeTo = path.url.searchParams.get("to")
  const maybeGas = path.url.searchParams.get("gas")
  const maybeValue = path.url.searchParams.get("value")
  const maybeNonce = path.url.searchParams.get("nonce")
  const maybeData = path.url.searchParams.get("data")
  const maybeGasPrice = path.url.searchParams.get("gasPrice")
  const maybeMaxFeePerGas = path.url.searchParams.get("maxFeePerGas")
  const maybeMaxPriorityFeePerGas = path.url.searchParams.get("maxPriorityFeePerGas")

  const trialQuery = useTransactionTrial(id)
  const maybeTrialData = trialQuery.current?.getOrNull()

  const transactionQuery = useTransactionWithReceipt(maybeTrialData?.transactions[0].uuid, maybeContext)
  const maybeTransaction = transactionQuery.current?.getOrNull()

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

  const simulationQuery = useSimulation(preTx, "latest", maybeContext)
  const currentSimulation = simulationQuery.current

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const transaction = Option.wrap(maybeTransaction).getOrThrow()

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, transaction.hash)]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path, maybeTransaction])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path])

  const onSendTransactionClick = useCallback(() => {
    location.replace(subpath.go(urlOf("/eth_sendTransaction", { trial: id, chain: chainId, target: maybeTo, value: maybeValue, nonce: maybeNonce, data: maybeData, gas: maybeGas, gasMode: "custom", gasPrice: maybeGasPrice, maxFeePerGas: maybeMaxFeePerGas, maxPriorityFeePerGas: maybeMaxPriorityFeePerGas, disableData: true, disableSign: true })))
  }, [subpath, id, chainId, maybeTo, maybeValue, maybeNonce, maybeData, maybeGas, maybeGasPrice, maybeMaxFeePerGas, maybeMaxPriorityFeePerGas])

  useEffect(() => {
    if (maybeTransaction == null)
      return
    approveOrAlert.run()
  }, [maybeTransaction, approveOrAlert])

  return <WalletDataContext.Provider value={maybeWallet}>
    <UserPage>
      <HashSubpathProvider>
        {subpath.url.pathname === "/eth_sendTransaction" &&
          <Dialog>
            <WalletTransactionDialog />
          </Dialog>}
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
        <div className="font-medium">
          Transaction
        </div>
        {preTx.from && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              From
            </div>
            <div className="w-4" />
            <SimpleInput
              readOnly
              value={preTx.from} />
          </ContrastLabel>
        </>}
        {preTx.to && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              To
            </div>
            <div className="w-4" />
            <SimpleInput
              readOnly
              value={preTx.to} />
          </ContrastLabel>
        </>}
        {preTx.value && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              Value
            </div>
            <div className="w-4" />
            <SimpleInput
              readOnly
              value={preTx.value} />
          </ContrastLabel>
        </>}
        {preTx.nonce && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              Nonce
            </div>
            <div className="w-4" />
            <SimpleInput
              readOnly
              value={preTx.nonce} />
          </ContrastLabel>
        </>}
        {preTx.data && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              Data
            </div>
            <div className="w-4" />
            <SimpleTextarea
              readOnly
              rows={3}
              value={preTx.data} />
          </ContrastLabel>
        </>}
        <div className="h-4" />
        <div className="font-medium">
          Simulation
        </div>
        <div className="text-contrast">
          The simulation logs are a preview of the transaction execution on the blockchain.
        </div>
        <div className="h-2" />
        {currentSimulation == null &&
          <div className="text-contrast">
            Loading...
          </div>}
        {currentSimulation?.isErr() &&
          <div className="text-red-400 dark:text-red-500">
            {currentSimulation.getErr().message}
          </div>}
        {currentSimulation?.isOk() &&
          <div className="flex flex-col gap-2">
            {currentSimulation.get().logs.map((log, i) =>
              <div className="p-2 bg-contrast rounded-xl"
                key={i}>
                <div className="font-medium">
                  {log.name}
                </div>
                <div className="text-contrast truncate">
                  {log.raw.address}
                </div>
                <div className="h-2" />
                <div className="flex flex-col gap-2">
                  {log.inputs.map((input, j) =>
                    <div className="p-2 bg-contrast rounded-xl"
                      key={j}>
                      <div className="font-medium">
                        {input.name} {input.type}
                      </div>
                      <div className="text-contrast truncate">
                        {typeof input.value === "string" ? input.value : JSON.stringify(input.value)}
                      </div>
                    </div>)}
                </div>
              </div>)}
          </div>}
        <div className="h-4 grow" />
        <div className="flex items-center flex-wrap-reverse gap-2">
          <WideClickableContrastButton
            onClick={rejectOrAlert.run}
            disabled={rejectOrAlert.loading}>
            <Outline.XMarkIcon className="size-5" />
            Reject
          </WideClickableContrastButton>
          <WideClickableOppositeButton
            onClick={onSendTransactionClick}>
            <Outline.CheckIcon className="size-5" />
            Transact
          </WideClickableOppositeButton>
        </div>
      </PageBody>
    </UserPage>
  </WalletDataContext.Provider>
}

export function PersonalSignPage() {
  const path = usePathContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const id = Option.wrap(path.url.searchParams.get("id")).getOrThrow()

  const walletId = Option.wrap(path.url.searchParams.get("walletId")).getOrThrow()
  const walletQuery = useWallet(walletId)
  const maybeWallet = walletQuery.current?.getOrNull()

  const message = Option.wrap(path.url.searchParams.get("message")).getOrThrow()

  const triedUserMessage = useMemo(() => Result.runAndWrapSync(() => {
    if (!message.startsWith("0x"))
      return message

    using memory = Base16.get().getOrThrow().padStartAndDecodeOrThrow(message.slice(2))

    return Bytes.toUtf8(memory.bytes)
  }), [message])

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const wallet = Option.wrap(maybeWallet).getOrThrow()
    const message = triedUserMessage.getOrThrow()

    const instance = await EthereumWalletInstance.createOrThrow(wallet, background)
    const signature = await instance.signPersonalMessageOrThrow(message, background)

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, signature)]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path, maybeWallet, triedUserMessage])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path])

  return <UserPage>
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
        {triedUserMessage.getOr("Could not decode message")}
      </div>
      <div className="h-4 grow" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableContrastButton
          onClick={rejectOrAlert.run}
          disabled={rejectOrAlert.loading}>
          <Outline.XMarkIcon className="size-5" />
          Reject
        </WideClickableContrastButton>
        <WideClickableOppositeButton
          onClick={approveOrAlert.run}
          disabled={approveOrAlert.loading}>
          <Outline.CheckIcon className="size-5" />
          Approve
        </WideClickableOppositeButton>
      </div>
    </PageBody>
  </UserPage>
}

export function TypedSignPage() {
  const path = usePathContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const id = Option.wrap(path.url.searchParams.get("id")).getOrThrow()

  const walletId = Option.wrap(path.url.searchParams.get("walletId")).getOrThrow()
  const walletQuery = useWallet(walletId)
  const maybeWallet = walletQuery.current?.getOrNull()

  const data = Option.wrap(path.url.searchParams.get("data")).getOrThrow()

  const triedParsedData = useMemo(() => Result.runAndWrapSync(() => {
    return JSON.parse(data) as Abi.Typed.TypedData // TODO: guard
  }), [data])

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const wallet = Option.wrap(maybeWallet).getOrThrow()
    const data = triedParsedData.getOrThrow()

    const instance = await EthereumWalletInstance.createOrThrow(wallet, background)
    const signature = await instance.signEIP712HashedMessageOrThrow(data, background)

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, signature)]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path, maybeWallet, triedParsedData])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path])

  return <UserPage>
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
        {triedParsedData.mapSync(x => JSON.stringify(x, undefined, 2)).getOr("Could not decode message")}
      </div>
      <div className="h-4 grow" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableContrastButton
          onClick={rejectOrAlert.run}
          disabled={rejectOrAlert.loading}>
          <Outline.XMarkIcon className="size-5" />
          Reject
        </WideClickableContrastButton>
        <WideClickableOppositeButton
          onClick={approveOrAlert.run}
          disabled={approveOrAlert.loading}>
          <Outline.CheckIcon className="size-5" />
          Approve
        </WideClickableOppositeButton>
      </div>
    </PageBody>
  </UserPage>
}

export function WalletAndChainSelectPage() {
  const path = usePathContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const subpath = useHashSubpath(path)
  const creator = useCoords(subpath, "/create")

  const id = Option.wrap(path.url.searchParams.get("id")).getOrThrow()

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

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (selecteds.length === 0)
      throw new UIError(`No wallet selected`)

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, [persistent, selecteds])]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path, selecteds, persistent])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path])

  const Header =
    <UserPageHeader title="Connect">
      <PaddedRoundedClickableNakedAnchor
        onKeyDown={creator.onKeyDown}
        onClick={creator.onClick}
        href={creator.href}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedClickableNakedAnchor>
    </UserPageHeader>

  const Body =
    <PageBody>
      <SelectableWalletGrid
        wallets={wallets.data?.get()}
        ok={onWalletClick}
        selecteds={selecteds} />
      <div className="h-4" />
      <label className="po-md flex items-center bg-contrast rounded-xl">
        <div className="flex-none">
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
        <WideClickableContrastButton
          onClick={rejectOrAlert.run}
          disabled={rejectOrAlert.loading}>
          <Outline.XMarkIcon className="size-5" />
          Reject
        </WideClickableContrastButton>
        <WideClickableOppositeButton
          onClick={approveOrAlert.run}
          disabled={approveOrAlert.loading}>
          <Outline.CheckIcon className="size-5" />
          Approve
        </WideClickableOppositeButton>
      </div>
    </PageBody>

  return <UserPage>
    <HashSubpathProvider>
      {subpath.url.pathname === "/create" &&
        <Menu>
          <WalletCreatorMenu />
        </Menu>}
      {subpath.url.pathname === "/create/standalone" &&
        <Dialog>
          <StandaloneWalletCreatorDialog />
        </Dialog>}
      {subpath.url.pathname === "/create/readonly" &&
        <Dialog>
          <ReadonlyWalletCreatorDialog />
        </Dialog>}
    </HashSubpathProvider>
    {Header}
    {Body}
  </UserPage>
}

export function DonePage() {
  const path = usePathContext().getOrThrow()
  const requests = useAppRequests().current?.getOrNull()

  useEffect(() => {
    if (!requests?.length)
      return
    location.replace(path.go("/requests"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests])

  return <UserPage>
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
        <ClickableOppositeAnchor
          href="#/home">
          <Outline.HomeIcon className="size-5" />
          Home
        </ClickableOppositeAnchor>
      </div>
    </PageBody>
  </UserPage>
}