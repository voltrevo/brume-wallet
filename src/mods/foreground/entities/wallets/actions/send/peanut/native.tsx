import { PeanutAbi } from "@/libs/abi/peanut.abi";
import { useCopy } from "@/libs/copy/copy";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { Peanut } from "@/libs/peanut";
import { useEffectButNotFirstTime } from "@/libs/react/effect";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog, Screen, useCloseContext } from "@/libs/ui/dialog/dialog";
import { qurl } from "@/libs/url/url";
import { useTransaction, useTransactionTrial } from "@/mods/foreground/entities/transactions/data";
import { PathContext, usePathState, useSearchState, useSubpath } from "@/mods/foreground/router/path/context";
import { Base16 } from "@hazae41/base16";
import { Bytes } from "@hazae41/bytes";
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane";
import { Cursor } from "@hazae41/cursor";
import { Keccak256 } from "@hazae41/keccak256";
import { Nullable, Option, Optional } from "@hazae41/option";
import { Result } from "@hazae41/result";
import { Secp256k1 } from "@hazae41/secp256k1";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { ShrinkableContrastButtonInInputBox, ShrinkableNakedButtonInInputBox, SimpleBox, SimpleInput, UrlState, WideShrinkableOppositeButton } from "..";
import { useNativeBalance, useNativePricedBalance } from "../../../../tokens/data";
import { useWalletDataContext } from "../../../context";
import { useEthereumContext2 } from "../../../data";
import { PriceResolver } from "../../../page";
import { WalletSendTransactionScreen } from "../../eth_sendTransaction";

export function WalletPeanutSendScreenNativeValue(props: {}) {
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()
  const subpath = useSubpath()

  const $state = usePathState<UrlState>()
  const [maybeTrial, setTrial] = useSearchState("trial", $state)
  const [maybeStep, setStep] = useSearchState("step", $state)
  const [maybeChain, setChain] = useSearchState("chain", $state)
  const [maybeValue, setValue] = useSearchState("value", $state)

  const trialUuidFallback = useConstant(() => crypto.randomUUID())
  const trialUuid = Option.wrap(maybeTrial).unwrapOr(trialUuidFallback)

  const chain = Option.unwrap(maybeChain)
  const chainData = chainByChainId[Number(chain)]
  const tokenData = chainData.token

  const context = useEthereumContext2(wallet.uuid, chainData).unwrap()

  const [weiPrices, setWeiPrices] = useState<Nullable<Nullable<Fixed.From>[]>>(() => {
    if (tokenData.pairs == null)
      return
    return new Array(tokenData.pairs.length)
  })

  const onWeiPrice = useCallback(([index, data]: [number, Nullable<Fixed.From>]) => {
    setWeiPrices(prices => {
      if (prices == null)
        return
      prices[index] = data
      return [...prices]
    })
  }, [])

  const maybeWeiPrice = useMemo(() => {
    return weiPrices?.reduce((a: Nullable<Fixed>, b: Nullable<Fixed.From>) => {
      if (b == null)
        return undefined
      if (a == null)
        return Fixed.from(b)
      return a.mul(Fixed.from(b))
    }, undefined)
  }, [weiPrices])

  const [rawValueInput = "", setRawValueInput] = useState<Optional<string>>(maybeValue)
  const [rawPricedInput = "", setRawPricedInput] = useState<Optional<string>>()

  const setRawValue = useCallback((input: string) => {
    try {
      setRawValueInput(input)

      if (input.trim().length === 0) {
        setRawPricedInput(undefined)
        return
      }

      if (maybeWeiPrice == null) {
        setRawPricedInput(undefined)
        return
      }

      const priced = Fixed.fromString(input, tokenData.decimals).mul(maybeWeiPrice)

      if (priced.value === 0n) {
        setRawPricedInput(undefined)
        return
      }

      setRawPricedInput(priced.toString())
    } catch (e: unknown) {
      setRawPricedInput(undefined)
      return
    }
  }, [tokenData, maybeWeiPrice])

  const setRawPrice = useCallback((input: string) => {
    try {
      setRawPricedInput(input)

      if (input.trim().length === 0) {
        setRawValueInput(undefined)
        return
      }

      if (maybeWeiPrice == null) {
        setRawValueInput(undefined)
        return
      }

      const valued = Fixed.fromString(input, tokenData.decimals).div(maybeWeiPrice)

      if (valued.value === 0n) {
        setRawValueInput(undefined)
        return
      }

      setRawValueInput(valued.toString())
    } catch (e: unknown) {
      setRawValueInput(undefined)
      return
    }
  }, [tokenData, maybeWeiPrice])

  const onValueInputChange = useInputChange(e => {
    setRawValue(e.target.value)
  }, [setRawValue])

  const onPricedInputChange = useInputChange(e => {
    setRawPrice(e.target.value)
  }, [setRawPrice])

  const valueInput = useDeferredValue(rawValueInput)

  useEffectButNotFirstTime(() => {
    setValue(valueInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueInput])

  const [mode, setMode] = useState<"valued" | "priced">("valued")

  const valuedBalanceQuery = useNativeBalance(wallet.address, "pending", context, weiPrices)
  const pricedBalanceQuery = useNativePricedBalance(wallet.address, "usd", context)

  const valuedBalanceData = valuedBalanceQuery.current?.ok().get()
  const pricedBalanceData = pricedBalanceQuery.current?.ok().get()

  const onValueMaxClick = useCallback(() => {
    if (valuedBalanceData == null)
      return
    setRawValue(Fixed.from(valuedBalanceData).toString())
  }, [valuedBalanceData, setRawValue])

  const onPricedMaxClick = useCallback(() => {
    if (pricedBalanceData == null)
      return
    setRawPrice(Fixed.from(pricedBalanceData).toString())
  }, [pricedBalanceData, setRawPrice])

  const onValuedPaste = useCallback(async () => {
    setRawValue(await navigator.clipboard.readText())
  }, [setRawValue])

  const onPricedPaste = useCallback(async () => {
    setRawPrice(await navigator.clipboard.readText())
  }, [setRawPrice])

  const onValuedClear = useCallback(async () => {
    setRawValue("")
  }, [setRawValue])

  const onPricedClear = useCallback(async () => {
    setRawPrice("")
  }, [setRawPrice])

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
    return Peanut.contracts[chainData.chainId]?.v4 as string | undefined
  }, [chainData])

  const triedFinalPassword = useMemo(() => Result.runAndDoubleWrapSync(() => {
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

    return bytes
  }), [])

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
      const token = "0x0000000000000000000000000000000000000000"
      const value = maybeFinalValue.value

      const password = triedFinalPassword.unwrap()
      const hash = Keccak256.get().hashOrThrow(password)
      const privateKey = Secp256k1.get().PrivateKey.tryImport(hash).unwrap()
      const publicKey = privateKey.tryGetPublicKey().unwrap().tryExportUncompressed().unwrap()
      const publicKeyHex = Base16.get().encodeOrThrow(publicKey)
      const publicKey20 = ZeroHexString.from(publicKeyHex.slice(-40))

      const abi = PeanutAbi.makeDeposit.from(token, 0, value, 0, publicKey20)

      return Abi.encodeOrThrow(abi)
    })
  }, [maybeFinalValue, triedFinalPassword])

  const onSendTransactionClick = useCallback(() => {
    subpath.go(qurl("/eth_sendTransaction", { trial: trialUuid, step: "value", chain: chainData.chainId, target: maybeContract, value: rawValue, data: maybeTriedMaybeFinalData?.ok().get(), disableTarget: true, disableValue: true, disableData: true, disableSign: true }))
  }, [subpath, trialUuid, chainData, maybeContract, rawValue, maybeTriedMaybeFinalData])

  const onClose = useCallback(() => {
    subpath.go(`/`)
  }, [subpath])

  const trialQuery = useTransactionTrial(trialUuid)
  const maybeTrialData = trialQuery.current?.ok().get()

  const transactionQuery = useTransaction(maybeTrialData?.transactions[0].uuid)
  const maybeTransaction = transactionQuery.current?.ok().get()

  const maybeTriedLink = useMemo(() => {
    if (maybeTransaction == null)
      return
    if (triedFinalPassword.isErr())
      return
    if (maybeTransaction.type !== "executed")
      return

    return Result.runAndDoubleWrapSync(() => {
      const signatureUtf8 = "DepositEvent(uint256,uint8,uint256,address)"
      const signatureBytes = Bytes.fromUtf8(signatureUtf8)

      using hashSlice = Keccak256.get().hashOrThrow(signatureBytes)
      const hashHex = `0x${Base16.get().encodeOrThrow(hashSlice)}`

      const log = maybeTransaction.receipt.logs.find(log => log.topics[0] === hashHex)

      if (log == null)
        throw new Error(`Could not find log`)

      const index = BigInt(log.topics[1])
      const password = Bytes.toUtf8(triedFinalPassword.get())

      return `https://peanut.to/claim?c=${chainData.chainId}&i=${index}&v=v4&p=${password}`
    })
  }, [chainData, maybeTransaction, triedFinalPassword])

  const onLinkCopy = useCopy(maybeTriedLink?.ok().inner)

  return <>
    <PathContext.Provider value={subpath}>
      {subpath.url.pathname === "/eth_sendTransaction" &&
        <Screen close={onClose}>
          <WalletSendTransactionScreen />
        </Screen>}
    </PathContext.Provider>
    {tokenData.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        ok={onWeiPrice} />)}
    <Dialog.Title close={close}>
      Send {tokenData.symbol} on {chainData.name}
    </Dialog.Title>
    <div className="h-4" />
    <SimpleBox>
      <div className="">
        Target
      </div>
      <div className="w-4" />
      <SimpleInput key="target"
        readOnly
        onFocus={onTargetFocus}
        value="Peanut" />
    </SimpleBox>
    <div className="h-2" />
    {mode === "valued" &&
      <SimpleBox>
        <div className="">
          Value
        </div>
        <div className="w-4" />
        <div className="grow flex flex-col overflow-hidden">
          <div className="flex items-center">
            <SimpleInput
              autoFocus
              value={rawValueInput}
              onChange={onValueInputChange}
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
          {rawValueInput.length === 0
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
      </SimpleBox>}
    {mode === "priced" &&
      <SimpleBox>
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
              {rawValueInput || "0.0"}
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
      </SimpleBox>}
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
      <div className="flex items-center">
        <WideShrinkableOppositeButton
          onClick={close}>
          <Outline.CheckIcon className="size-5" />
          Close
        </WideShrinkableOppositeButton>
      </div>
    </>}
    {!maybeTriedLink?.isOk() &&
      <div className="flex items-center">
        <WideShrinkableOppositeButton
          onClick={onSendTransactionClick}>
          <Outline.PaperAirplaneIcon className="size-5" />
          Transact
        </WideShrinkableOppositeButton>
      </div>}
  </>
}