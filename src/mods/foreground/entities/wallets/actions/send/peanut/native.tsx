import { PeanutAbi } from "@/libs/abi/peanut.abi";
import { useCopy } from "@/libs/copy/copy";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { Peanut } from "@/libs/peanut";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog, Dialog2, useCloseContext } from "@/libs/ui/dialog/dialog";
import { qurl } from "@/libs/url/url";
import { randomUUID } from "@/libs/uuid/uuid";
import { useTransactionTrial, useTransactionWithReceipt } from "@/mods/foreground/entities/transactions/data";
import { HashSubpathProvider, useHashSubpath, useKeyValueState, usePathContext, usePathState } from "@/mods/foreground/router/path/context";
import { Base16 } from "@hazae41/base16";
import { Bytes } from "@hazae41/bytes";
import { Abi, Address, Fixed, ZeroHexString } from "@hazae41/cubane";
import { Cursor } from "@hazae41/cursor";
import { Keccak256 } from "@hazae41/keccak256";
import { Nullable, Option, Optional } from "@hazae41/option";
import { Result } from "@hazae41/result";
import { Secp256k1 } from "@hazae41/secp256k1";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { RoundedShrinkableNakedButton, ShrinkableContrastButtonInInputBox, SimpleInput, SimpleLabel, UrlState, WideShrinkableOppositeButton } from "..";
import { useNativeBalance, useNativePricedBalance } from "../../../../tokens/data";
import { useWalletDataContext } from "../../../context";
import { useEthereumContext2 } from "../../../data";
import { PriceResolver } from "../../../page";
import { TransactionCard, WalletTransactionDialog } from "../../eth_sendTransaction";

export function WalletPeanutSendScreenNativeValue(props: {}) {
  const path = usePathContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()

  const subpath = useHashSubpath(path)

  const $state = usePathState<UrlState>()
  const [maybeStep, setStep] = useKeyValueState("step", $state)
  const [maybeChain, setChain] = useKeyValueState("chain", $state)
  const [maybeValue, setValue] = useKeyValueState("value", $state)
  const [maybePassword, setPassword] = useKeyValueState("password", $state)
  const [maybeTrial0, setTrial0] = useKeyValueState("trial0", $state)

  const trial0UuidFallback = useConstant(() => randomUUID())
  const trial0Uuid = Option.wrap(maybeTrial0).unwrapOr(trial0UuidFallback)

  useEffect(() => {
    if (maybeTrial0 === trial0Uuid)
      return
    setTrial0(trial0Uuid)
  }, [maybeTrial0, setTrial0, trial0Uuid])

  const chain = Option.unwrap(maybeChain)
  const chainData = chainDataByChainId[Number(chain)]
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

  const onPricedClick = useCallback(() => {
    setMode("priced")
  }, [])

  const onValuedClick = useCallback(() => {
    setMode("valued")
  }, [])

  const maybeContract = useMemo(() => {
    return Peanut.contracts[chainData.chainId]?.v4 as ZeroHexString | undefined
  }, [chainData])

  const password = useMemo(() => {
    if (maybePassword != null)
      return maybePassword

    const byte = new Uint8Array(1)
    const bytes = new Uint8Array(32)
    const cursor = new Cursor(bytes)

    function isAlphanumeric(byte: number) {
      if (byte >= 97 /*a*/ && byte <= 122 /*z*/)
        return true
      if (byte >= 65 /*A*/ && byte <= 90 /*Z*/)
        return true
      if (byte >= 48 /*0*/ && byte <= 57 /*9*/)
        return true
      return false
    }

    while (cursor.remaining) {
      if (!isAlphanumeric(crypto.getRandomValues(byte)[0]))
        continue
      cursor.writeOrThrow(byte)
    }

    return Bytes.toUtf8(bytes)
  }, [maybePassword])

  useEffect(() => {
    if (maybePassword === password)
      return
    setPassword(password)
  }, [maybePassword, password, setPassword])

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

  const maybeTriedMaybeFinalData = useMemo(() => {
    if (maybeFinalValue == null)
      return undefined

    return Result.runAndDoubleWrapSync(() => {
      const token = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      const value = maybeFinalValue.value

      const passwordBytes = Bytes.fromUtf8(password)
      const hashSlice = Keccak256.get().hashOrThrow(passwordBytes)
      const privateKey = Secp256k1.get().PrivateKey.tryImport(hashSlice).unwrap()
      const publicKey = privateKey.tryGetPublicKey().unwrap().tryExportUncompressed().unwrap().copyAndDispose()
      const address = Address.compute(publicKey)

      const abi = PeanutAbi.makeDeposit.from(token, 0, value, 0, address)
      const hex = Abi.encodeOrThrow(abi)

      return hex
    })
  }, [maybeFinalValue, password])

  const onSendTransactionClick = useCallback(() => {
    location.replace(subpath.go(qurl("/eth_sendTransaction", { trial: trial0Uuid, chain: chainData.chainId, target: maybeContract, value: rawValue, data: maybeTriedMaybeFinalData?.ok().get(), disableData: true, disableSign: true })))
  }, [subpath, trial0Uuid, chainData, maybeContract, rawValue, maybeTriedMaybeFinalData])

  const trial0Query = useTransactionTrial(trial0Uuid)
  const maybeTrial0Data = trial0Query.current?.ok().get()

  const transaction0Query = useTransactionWithReceipt(maybeTrial0Data?.transactions[0].uuid, context)
  const maybeTransaction0 = transaction0Query.current?.ok().get()

  const maybeTriedLink = useMemo(() => {
    if (maybeTransaction0 == null)
      return
    if (maybeTransaction0.type !== "executed")
      return

    return Result.runAndDoubleWrapSync(() => {
      const signatureUtf8 = "DepositEvent(uint256,uint8,uint256,address)"
      const signatureBytes = Bytes.fromUtf8(signatureUtf8)

      using hashSlice = Keccak256.get().hashOrThrow(signatureBytes)
      const hashHex = `0x${Base16.get().encodeOrThrow(hashSlice)}`

      const log = maybeTransaction0.receipt.logs.find(log => log.topics[0] === hashHex)

      if (log == null)
        throw new Error(`Could not find log`)

      const index = BigInt(log.topics[1])

      return `https://peanut.to/claim?c=${chainData.chainId}&i=${index}&v=v4&t=ui#p=${password}`
    })
  }, [maybeTransaction0, password, chainData.chainId])

  const onLinkCopy = useCopy(maybeTriedLink?.ok().inner)

  const onClose = useCallback(() => {
    close()
  }, [close])

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === "/eth_sendTransaction" &&
        <Dialog2>
          <WalletTransactionDialog />
        </Dialog2>}
    </HashSubpathProvider>
    {tokenData.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        ok={onPrice} />)}
    <Dialog.Title>
      Send {tokenData.symbol} on {chainData.name}
    </Dialog.Title>
    <div className="h-4" />
    <SimpleLabel>
      <div className="shrink-0">
        Target
      </div>
      <div className="w-4" />
      <SimpleInput
        readOnly
        onFocus={onTargetFocus}
        value="Peanut" />
    </SimpleLabel>
    <div className="h-2" />
    {mode === "valued" &&
      <SimpleLabel>
        <div className="shrink-0">
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
            ? <RoundedShrinkableNakedButton
              onClick={onValuedPaste}>
              <Outline.ClipboardIcon className="size-4" />
            </RoundedShrinkableNakedButton>
            : <RoundedShrinkableNakedButton
              onClick={onValuedClear}>
              <Outline.XMarkIcon className="size-4" />
            </RoundedShrinkableNakedButton>}
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
        <div className="shrink-0">
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
            ? <RoundedShrinkableNakedButton
              onClick={onPricedPaste}>
              <Outline.ClipboardIcon className="size-4" />
            </RoundedShrinkableNakedButton>
            : <RoundedShrinkableNakedButton
              onClick={onPricedClear}>
              <Outline.XMarkIcon className="size-4" />
            </RoundedShrinkableNakedButton>}
          <div className="w-1" />
          <ShrinkableContrastButtonInInputBox
            disabled={pricedBalanceQuery.data == null}
            onClick={onPricedMaxClick}>
            100%
          </ShrinkableContrastButtonInInputBox>
        </div>
      </SimpleLabel>}
    <div className="h-4" />
    {maybeTransaction0 != null && <>
      <div className="font-medium">
        Deposit
      </div>
      <div className="h-2" />
      <TransactionCard
        data={maybeTransaction0}
        onSend={() => { }}
        onRetry={() => { }} />
      <div className="h-4" />
    </>}
    <div className="h-4 grow" />
    {maybeTriedLink?.isOk() && <>
      <div className="po-md flex items-center bg-contrast rounded-xl">
        <div className="flex flex-col truncate">
          <div className="flex items-center">
            <div className="font-medium">
              Link created
            </div>
          </div>
          <div className="text-contrast truncate">
            {maybeTriedLink.get()}
          </div>
          <div className="h-2" />
          <div className="flex items-center gap-1">
            <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
              onClick={onLinkCopy.run}>
              <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
                Copy
                {onLinkCopy.current
                  ? <Outline.CheckIcon className="size-4" />
                  : <Outline.ClipboardIcon className="size-4" />}
              </div>
            </button>
            <a className="group px-2 bg-contrast rounded-full"
              target="_blank" rel="noreferrer"
              href={maybeTriedLink.get()}>
              <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
                Open
                <Outline.ArrowTopRightOnSquareIcon className="size-4" />
              </div>
            </a>
          </div>
        </div>
      </div>
      <div className="h-2" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableOppositeButton
          onClick={onClose}>
          <Outline.CheckIcon className="size-5" />
          Close
        </WideShrinkableOppositeButton>
      </div>
    </>}
    {maybeTransaction0 == null &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableOppositeButton
          onClick={onSendTransactionClick}>
          <Outline.PaperAirplaneIcon className="size-5" />
          Transact
        </WideShrinkableOppositeButton>
      </div>}
  </>
}