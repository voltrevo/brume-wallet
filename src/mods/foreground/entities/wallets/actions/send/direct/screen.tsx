import { useCopy } from "@/libs/copy/copy";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Loading } from "@/libs/ui/loading/loading";
import { qurl } from "@/libs/url/url";
import { ExecutedTransactionData, PendingTransactionData, SignedTransactionData, TransactionData } from "@/mods/background/service_worker/entities/transactions/data";
import { PathContext, usePathState, useSearchState, useSubpath } from "@/mods/foreground/router/path/context";
import { Address, Fixed } from "@hazae41/cubane";
import { Nullable, Option, Optional } from "@hazae41/option";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ShrinkableContrastButtonInInputBox, ShrinkableNakedButtonInInputBox, SimpleInput, SimpleLabel, UrlState, WideShrinkableOppositeButton } from "..";
import { useEnsLookup } from "../../../../names/data";
import { useNativeBalance, useNativePricedBalance } from "../../../../tokens/data";
import { useTransactionTrial, useTransactionWithReceipt } from "../../../../transactions/data";
import { useWalletDataContext } from "../../../context";
import { useEthereumContext, useEthereumContext2 } from "../../../data";
import { PriceResolver } from "../../../page";
import { WalletTransactionScreen } from "../../eth_sendTransaction";

export function WalletDirectSendScreenNativeValue(props: {}) {
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()
  const subpath = useSubpath()

  const $state = usePathState<UrlState>()
  const [maybeStep, setStep] = useSearchState("step", $state)
  const [maybeChain, setChain] = useSearchState("chain", $state)
  const [maybeTarget, setTarget] = useSearchState("target", $state)
  const [maybeValue, setValue] = useSearchState("value", $state)
  const [maybeTrial0, setTrial0] = useSearchState("trial0", $state)

  const trial0UuidFallback = useConstant(() => crypto.randomUUID())
  const trial0Uuid = Option.wrap(maybeTrial0).unwrapOr(trial0UuidFallback)

  useEffect(() => {
    if (maybeTrial0 === trial0Uuid)
      return
    setTrial0(trial0Uuid)
  }, [maybeTrial0, setTrial0, trial0Uuid])

  const chain = Option.unwrap(maybeChain)
  const chainData = chainByChainId[Number(chain)]
  const tokenData = chainData.token

  const context = useEthereumContext2(wallet.uuid, chainData).unwrap()

  const [prices, setPrices] = useState<Nullable<Nullable<Fixed.From>[]>>(() => {
    if (tokenData.pairs == null)
      return
    return new Array(tokenData.pairs.length)
  })

  const onPrice = useCallback(([index, data]: [number, Nullable<Fixed.From>]) => {
    setPrices(prices => {
      if (prices == null)
        return
      prices[index] = data
      return [...prices]
    })
  }, [])

  const maybePrice = useMemo(() => {
    return prices?.reduce((a: Fixed, b: Nullable<Fixed.From>) => {
      if (b == null)
        return a
      return a.mul(Fixed.from(b))
    }, Fixed.unit(tokenData.decimals))
  }, [prices, tokenData])

  const [rawValuedInput = "", setRawValuedInput] = useState<Optional<string>>(maybeValue)
  const [rawPricedInput = "", setRawPricedInput] = useState<Optional<string>>()

  const valuedInput = useDeferredValue(rawValuedInput)

  const getRawPricedInput = useCallback((rawValuedInput: string) => {
    try {
      if (rawValuedInput.trim().length === 0)
        return undefined

      if (maybePrice == null)
        return undefined

      const priced = Fixed.fromString(rawValuedInput, tokenData.decimals).mul(maybePrice)

      if (priced.value === 0n)
        return undefined

      return priced.toString()
    } catch (e: unknown) {
      return undefined
    }
  }, [maybePrice, tokenData])

  const getRawValuedInput = useCallback((rawPricedInput: string) => {
    try {
      if (rawPricedInput.trim().length === 0)
        return undefined

      if (maybePrice == null)
        return undefined

      const valued = Fixed.fromString(rawPricedInput, tokenData.decimals).div(maybePrice)

      if (valued.value === 0n)
        return undefined

      return valued.toString()
    } catch (e: unknown) {
      return undefined
    }
  }, [maybePrice, tokenData])

  const onValuedChange = useCallback((input: string) => {
    setRawPricedInput(getRawPricedInput(input))
  }, [getRawPricedInput])

  const onPricedChange = useCallback((input: string) => {
    setRawValuedInput(getRawValuedInput(input))
  }, [getRawValuedInput])

  const setRawValued = useCallback((input: string) => {
    setRawValuedInput(input)
    onValuedChange(input)
  }, [onValuedChange])

  const setRawPriced = useCallback((input: string) => {
    setRawPricedInput(input)
    onPricedChange(input)
  }, [onPricedChange])

  const onValuedInputChange = useInputChange(e => {
    setRawValued(e.target.value)
  }, [setRawValued])

  const onPricedInputChange = useInputChange(e => {
    setRawPriced(e.target.value)
  }, [setRawPriced])

  useEffect(() => {
    if (maybePrice == null)
      return
    onValuedChange(valuedInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maybePrice])

  useEffect(() => {
    setValue(valuedInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuedInput])

  const [mode, setMode] = useState<"valued" | "priced">("valued")

  const valuedBalanceQuery = useNativeBalance(wallet.address, "pending", context, prices)
  const pricedBalanceQuery = useNativePricedBalance(wallet.address, "usd", context)

  const valuedBalanceData = valuedBalanceQuery.current?.ok().get()
  const pricedBalanceData = pricedBalanceQuery.current?.ok().get()

  const onValueMaxClick = useCallback(() => {
    if (valuedBalanceData == null)
      return
    setRawValued(Fixed.from(valuedBalanceData).toString())
  }, [valuedBalanceData, setRawValued])

  const onPricedMaxClick = useCallback(() => {
    if (pricedBalanceData == null)
      return
    setRawPriced(Fixed.from(pricedBalanceData).toString())
  }, [pricedBalanceData, setRawPriced])

  const onValuedPaste = useCallback(async () => {
    setRawValued(await navigator.clipboard.readText())
  }, [setRawValued])

  const onPricedPaste = useCallback(async () => {
    setRawPriced(await navigator.clipboard.readText())
  }, [setRawPriced])

  const onValuedClear = useCallback(async () => {
    setRawValued("")
  }, [setRawValued])

  const onPricedClear = useCallback(async () => {
    setRawPriced("")
  }, [setRawPriced])

  const onTargetFocus = useCallback(() => {
    setStep("target")
  }, [setStep])

  const onNonceClick = useCallback(() => {
    setStep("nonce")
  }, [setStep])

  const onPricedClick = useCallback(() => {
    setMode("priced")
  }, [])

  const onValuedClick = useCallback(() => {
    setMode("valued")
  }, [])

  const mainnet = useEthereumContext(wallet.uuid, chainByChainId[1])

  const maybeEnsQueryKey = maybeTarget?.endsWith(".eth")
    ? maybeTarget
    : undefined

  const ensTargetQuery = useEnsLookup(maybeEnsQueryKey, mainnet)
  const maybeEnsTarget = ensTargetQuery.current?.ok().get()

  const maybeFinalTarget = useMemo(() => {
    if (maybeTarget == null)
      return undefined
    if (Address.from(maybeTarget) != null)
      return maybeTarget
    if (maybeEnsTarget != null)
      return maybeEnsTarget
    return undefined
  }, [maybeTarget, maybeEnsTarget])

  const rawValue = useMemo(() => {
    return maybeValue?.trim().length
      ? maybeValue.trim()
      : "0"
  }, [maybeValue])

  const maybeFinalValue = useMemo(() => {
    try {
      return Fixed.fromString(rawValue, tokenData.decimals)
    } catch { }
  }, [rawValue, tokenData])

  const onSendTransactionClick = useCallback(() => {
    location.href = subpath.go(qurl("/eth_sendTransaction", { trial: trial0Uuid, step: "value", chain: chainData.chainId, target: maybeFinalTarget, value: maybeFinalValue?.toString(), disableTarget: true, disableValue: true })).href
  }, [subpath, trial0Uuid, chainData.chainId, maybeFinalValue, maybeFinalTarget])

  const onClose = useCallback(() => {
    location.href = subpath.go(`/`).href
  }, [subpath])

  const trialQuery = useTransactionTrial(trial0Uuid)
  const maybeTrialData = trialQuery.current?.ok().get()

  const transactionQuery = useTransactionWithReceipt(maybeTrialData?.transactions[0].uuid, context)
  const maybeTransaction = transactionQuery.current?.ok().get()

  return <>
    <PathContext.Provider value={subpath}>
      {subpath.url.pathname === "/eth_sendTransaction" &&
        <Dialog close={onClose}>
          <WalletTransactionScreen />
        </Dialog>}
    </PathContext.Provider>
    {tokenData.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        ok={onPrice} />)}
    <Dialog.Title>
      Transact on {chainData.name}
    </Dialog.Title>
    <div className="h-4" />
    <SimpleLabel>
      <div className="">
        Target
      </div>
      <div className="w-4" />
      <SimpleInput key="target"
        readOnly
        onFocus={onTargetFocus}
        value={maybeTarget} />
    </SimpleLabel>
    <div className="h-2" />
    {mode === "valued" &&
      <SimpleLabel>
        <div className="">
          Value
        </div>
        <div className="w-4" />
        <div className="grow flex flex-col overflow-hidden">
          <div className="flex items-center">
            <SimpleInput
              autoFocus
              value={rawValuedInput}
              onChange={onValuedInputChange}
              placeholder="0.0" />
            <div className="w-1" />
            <div className="text-contrast">
              {tokenData.symbol}
            </div>
          </div>
          <div className="flex items-center cursor-pointer"
            role="button"
            onClick={onPricedClick}>
            <div className="text-contrast truncate">
              {rawPricedInput || "0.0"}
            </div>
            <div className="grow" />
            <div className="text-contrast">
              USD
            </div>
          </div>
        </div>
        <div className="w-2" />
        <div className="flex items-center">
          {rawValuedInput.length === 0
            ? <ShrinkableNakedButtonInInputBox
              onClick={onValuedPaste}>
              <Outline.ClipboardIcon className="size-4" />
            </ShrinkableNakedButtonInInputBox>
            : <ShrinkableNakedButtonInInputBox
              onClick={onValuedClear}>
              <Outline.XMarkIcon className="size-4" />
            </ShrinkableNakedButtonInInputBox>}
          <div className="w-1" />
          <ShrinkableContrastButtonInInputBox
            disabled={valuedBalanceQuery.data == null}
            onClick={onValueMaxClick}>
            100%
          </ShrinkableContrastButtonInInputBox>
        </div>
      </SimpleLabel>}
    {mode === "priced" &&
      <SimpleLabel>
        <div className="">
          Value
        </div>
        <div className="w-4" />
        <div className="grow flex flex-col overflow-hidden">
          <div className="flex items-center">
            <SimpleInput
              autoFocus
              value={rawPricedInput}
              onChange={onPricedInputChange}
              placeholder="0.0" />
            <div className="w-1" />
            <div className="text-contrast">
              USD
            </div>
          </div>
          <div className="flex items-center cursor-pointer"
            role="button"
            onClick={onValuedClick}>
            <div className="text-contrast truncate">
              {rawValuedInput || "0.0"}
            </div>
            <div className="grow" />
            <div className="text-contrast">
              {tokenData.symbol}
            </div>
          </div>
        </div>
        <div className="w-2" />
        <div className="flex items-center">
          {rawPricedInput.length === 0
            ? <ShrinkableNakedButtonInInputBox
              onClick={onPricedPaste}>
              <Outline.ClipboardIcon className="size-4" />
            </ShrinkableNakedButtonInInputBox>
            : <ShrinkableNakedButtonInInputBox
              onClick={onPricedClear}>
              <Outline.XMarkIcon className="size-4" />
            </ShrinkableNakedButtonInInputBox>}
          <div className="w-1" />
          <ShrinkableContrastButtonInInputBox
            disabled={pricedBalanceQuery.data == null}
            onClick={onPricedMaxClick}>
            100%
          </ShrinkableContrastButtonInInputBox>
        </div>
      </SimpleLabel>}
    <div className="h-4" />
    {maybeTransaction != null && <>
      <div className="font-medium">
        Transfer
      </div>
      <div className="h-2" />
      <TransactionCard
        data={maybeTransaction}
        onSend={() => { }}
        onRetry={() => { }} />
      <div className="h-4" />
    </>}
    <div className="h-4 grow" />
    {maybeTransaction == null &&
      <div className="flex items-center">
        <WideShrinkableOppositeButton
          onClick={onSendTransactionClick}>
          <Outline.PaperAirplaneIcon className="size-5" />
          Transact
        </WideShrinkableOppositeButton>
      </div>}
    {maybeTransaction != null &&
      <div className="flex items-center gap-2">
        <WideShrinkableOppositeButton
          onClick={close}>
          <Outline.CheckIcon className="size-5" />
          Close
        </WideShrinkableOppositeButton>
      </div>}
  </>
}

export function ExecutedTransactionCard(props: { data: ExecutedTransactionData }) {
  const { data } = props

  const onCopy = useCopy(data.hash)

  const chainData = chainByChainId[data.chainId]

  return <div className="po-md flex items-center bg-contrast rounded-xl">
    <div className="flex flex-col truncate">
      <div className="flex items-center">
        <Outline.CheckIcon className="size-4 shrink-0" />
        <div className="w-2" />
        <div className="font-medium">
          Transaction confirmed
        </div>
      </div>
      <div className="text-contrast truncate">
        {data.hash}
      </div>
      <div className="h-2" />
      <div className="flex items-center gap-1">
        <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onCopy.run}>
          <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
            Copy
            {onCopy.current
              ? <Outline.CheckIcon className="size-4" />
              : <Outline.ClipboardIcon className="size-4" />}
          </div>
        </button>
        <a className="group px-2 bg-contrast rounded-full"
          target="_blank" rel="noreferrer"
          href={`${chainData.etherscan}/tx/${data.hash}`}>
          <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
            Open
            <Outline.ArrowTopRightOnSquareIcon className="size-4" />
          </div>
        </a>
      </div>
    </div>
  </div>
}

export function TransactionCard(props: { data: TransactionData } & { onSend: (data: TransactionData) => void } & { onRetry: (data: TransactionData) => void }) {
  const { data, onSend, onRetry } = props

  if (data?.type === "signed")
    return <SignedTransactionCard
      onSend={onSend}
      data={data} />

  if (data?.type === "pending")
    return <PendingTransactionCard
      onRetry={onRetry}
      data={data} />

  if (data?.type === "executed")
    return <ExecutedTransactionCard
      data={data} />

  return null
}

export function PendingTransactionCard(props: { data: PendingTransactionData } & { onRetry: (data: TransactionData) => void }) {
  const { data, onRetry } = props

  const onCopy = useCopy(data.hash)

  const onRetryClick = useCallback(() => {
    onRetry(data)
  }, [data, onRetry])

  const chainData = chainByChainId[data.chainId]

  return <div className="po-md flex items-center bg-contrast rounded-xl">
    <div className="flex flex-col truncate">
      <div className="flex items-center">
        <Loading className="size-4 shrink-0" />
        <div className="w-2" />
        <div className="font-medium">
          Transaction sent
        </div>
      </div>
      <div className="text-contrast truncate">
        {data.hash}
      </div>
      <div className="h-2" />
      <div className="flex items-center gap-1">
        <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onCopy.run}>
          <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
            Copy
            {onCopy.current
              ? <Outline.CheckIcon className="size-4" />
              : <Outline.ClipboardIcon className="size-4" />}
          </div>
        </button>
        <a className="group px-2 bg-contrast rounded-full"
          target="_blank" rel="noreferrer"
          href={`${chainData.etherscan}/tx/${data.hash}`}>
          <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
            Open
            <Outline.ArrowTopRightOnSquareIcon className="size-4" />
          </div>
        </a>
        <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onRetryClick}>
          <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
            Retry
            <Outline.BoltIcon className="size-4" />
          </div>
        </button>
      </div>
    </div>
  </div>
}

export function SignedTransactionCard(props: { data: SignedTransactionData } & { onSend: (data: TransactionData) => void }) {
  const { data, onSend } = props

  const onCopy = useCopy(data.data)

  const onSendClick = useCallback(() => {
    onSend(data)
  }, [data, onSend])

  return <div className="po-md flex items-center bg-contrast rounded-xl">
    <div className="flex flex-col truncate">
      <div className="flex items-center">
        <div className="font-medium">
          Transaction signed
        </div>
      </div>
      <div className="text-contrast truncate">
        {data.data}
      </div>
      <div className="h-2" />
      <div className="flex items-center gap-1">
        <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onCopy.run}>
          <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
            Copy
            {onCopy.current
              ? <Outline.CheckIcon className="size-4" />
              : <Outline.ClipboardIcon className="size-4" />}
          </div>
        </button>
        <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onSendClick}>
          <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
            Send
            <Outline.PaperAirplaneIcon className="size-4" />
          </div>
        </button>
      </div>
    </div>
  </div>
}