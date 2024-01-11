import { TokenAbi } from "@/libs/abi/erc20.abi";
import { chainByChainId, tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useInputChange } from "@/libs/react/events";
import { Dialog, Screen, useCloseContext } from "@/libs/ui/dialog/dialog";
import { qurl } from "@/libs/url/url";
import { PathContext, usePathState, useSearchState, useSubpath } from "@/mods/foreground/router/path/context";
import { Abi, Address, Fixed } from "@hazae41/cubane";
import { Nullable, Option, Optional } from "@hazae41/option";
import { Result } from "@hazae41/result";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ShrinkableContrastButtonInInputBox, ShrinkableNakedButtonInInputBox, SimpleBox, SimpleInput, UrlState, WideShrinkableOppositeButton } from "..";
import { useEnsLookup } from "../../../../names/data";
import { useNativeBalance, useNativePricedBalance, useToken } from "../../../../tokens/data";
import { useNonce } from "../../../../unknown/data";
import { useWalletDataContext } from "../../../context";
import { useEthereumContext, useEthereumContext2 } from "../../../data";
import { PriceResolver } from "../../../page";
import { WalletSendTransactionScreen } from "../../eth_sendTransaction";

export function WalletSendScreenContractValue(props: {}) {
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()
  const subpath = useSubpath()

  const $state = usePathState<UrlState>()
  const [maybeStep, setStep] = useSearchState("step", $state)
  const [maybeChain, setChain] = useSearchState("chain", $state)
  const [maybeToken, setToken] = useSearchState("token", $state)
  const [maybeTarget, setTarget] = useSearchState("target", $state)
  const [maybeValue, setValue] = useSearchState("value", $state)

  const chain = Option.unwrap(maybeChain)
  const chainData = chainByChainId[Number(chain)]

  const token = Option.unwrap(maybeToken)
  const tokenQuery = useToken(chainData.chainId, token)

  const maybeTokenData = Option.wrap(tokenQuery.current?.get())
  const maybeTokenDef = Option.wrap(tokenByAddress[token])
  const tokenData = maybeTokenData.or(maybeTokenDef).unwrap()

  const context = useEthereumContext2(wallet.uuid, chainData).unwrap()

  const pendingNonceQuery = useNonce(wallet.address, context)
  const maybePendingNonce = pendingNonceQuery.current?.ok().get()

  const [tokenPrices, setTokenPrices] = useState<Nullable<Nullable<Fixed.From>[]>>(() => {
    if (tokenData.pairs == null)
      return
    return new Array(tokenData.pairs.length)
  })

  const [chainPrices, setChainPrices] = useState(() => {
    if (chainData.token.pairs == null)
      return
    return new Array(chainData.token.pairs.length)
  })

  const onTokenPrice = useCallback(([index, data]: [number, Nullable<Fixed.From>]) => {
    setTokenPrices(prices => {
      if (prices == null)
        return
      prices[index] = data
      return [...prices]
    })
  }, [])

  const onChainPrice = useCallback(([index, data]: [number, Nullable<Fixed.From>]) => {
    setChainPrices(prices => {
      if (prices == null)
        return
      prices[index] = data
      return [...prices]
    })
  }, [])

  const maybeTokenPrice = useMemo(() => {
    if (tokenPrices == null)
      return

    return tokenPrices.reduce((a: Nullable<Fixed>, b: Nullable<Fixed.From>) => {
      if (a == null)
        return undefined
      if (b == null)
        return undefined
      return a.mul(Fixed.from(b))
    }, Fixed.unit(18))
  }, [tokenPrices])

  const maybeChainPrice = useMemo(() => {
    if (chainPrices == null)
      return

    return chainPrices.reduce((a: Nullable<Fixed>, b: Nullable<Fixed.From>) => {
      if (a == null)
        return undefined
      if (b == null)
        return undefined
      return a.mul(Fixed.from(b))
    }, Fixed.unit(18))
  }, [chainPrices])

  const [rawValuedInput = "", setRawValuedInput] = useState<Optional<string>>(maybeValue)
  const [rawPricedInput = "", setRawPricedInput] = useState<Optional<string>>()

  const valuedInput = useDeferredValue(rawValuedInput)

  const onValuedChange = useCallback((input: string) => {
    try {
      if (input.trim().length === 0) {
        setRawPricedInput(undefined)
        return
      }

      if (maybeTokenPrice == null) {
        setRawPricedInput(undefined)
        return
      }

      const priced = Fixed.fromString(input, tokenData.decimals).mul(maybeTokenPrice)

      if (priced.value === 0n) {
        setRawPricedInput(undefined)
        return
      }

      setRawPricedInput(priced.toString())
    } catch (e: unknown) {
      setRawPricedInput(undefined)
      return
    }
  }, [maybeTokenPrice, tokenData])

  const onPricedChange = useCallback((input: string) => {
    try {
      if (input.trim().length === 0) {
        setRawValuedInput(undefined)
        return
      }

      if (maybeTokenPrice == null) {
        setRawValuedInput(undefined)
        return
      }

      const valued = Fixed.fromString(input, tokenData.decimals).div(maybeTokenPrice)

      if (valued.value === 0n) {
        setRawValuedInput(undefined)
        return
      }

      setRawValuedInput(valued.toString())
    } catch (e: unknown) {
      setRawValuedInput(undefined)
      return
    }
  }, [maybeTokenPrice, tokenData])

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
    if (maybeTokenPrice == null)
      return
    onValuedChange(valuedInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maybeTokenPrice])

  useEffect(() => {
    setValue(valuedInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuedInput])

  const [mode, setMode] = useState<"valued" | "priced">("valued")

  const valuedBalanceQuery = useNativeBalance(wallet.address, "pending", context, tokenPrices)
  const pricedBalanceQuery = useNativePricedBalance(wallet.address, "usd", context)

  const valuedBalanceData = valuedBalanceQuery.current?.ok().get()
  const pricedBalanceData = pricedBalanceQuery.current?.ok().get()

  const onValueMaxClick = useCallback(() => {
    if (valuedBalanceData == null)
      return
    setValue(Fixed.from(valuedBalanceData).toString())
  }, [valuedBalanceData, setValue])

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

  const maybeTriedMaybeFinalData = useMemo(() => {
    if (maybeFinalTarget == null)
      return undefined
    if (maybeFinalValue == null)
      return undefined

    return Result.runAndDoubleWrapSync(() => {
      const address = Address.fromOrThrow(maybeFinalTarget)
      const value = maybeFinalValue.value

      const abi = TokenAbi.transfer.from(address, value)

      return Abi.encodeOrThrow(abi)
    })
  }, [maybeFinalTarget, maybeFinalValue])

  console.log(maybeEnsTarget, maybeFinalTarget, maybeFinalValue, maybeTriedMaybeFinalData)

  const onSendTransactionClick = useCallback(() => {
    subpath.go(qurl("/eth_sendTransaction", { step: "value", chain: chainData.chainId, target: tokenData.address, data: maybeTriedMaybeFinalData?.ok().get(), disableTarget: true, disableValue: true, disableData: true }))
  }, [subpath, chainData, tokenData, maybeTriedMaybeFinalData])

  const onClose = useCallback(() => {
    subpath.go(`/`)
  }, [subpath])

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
        ok={onTokenPrice} />)}
    {chainData.token.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        ok={onChainPrice} />)}
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
        value={maybeTarget} />
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
      </SimpleBox>}
    <div className="h-4 grow" />
    <div className="flex items-center">
      <WideShrinkableOppositeButton
        onClick={onSendTransactionClick}>
        <Outline.PaperAirplaneIcon className="size-5" />
        Transact
      </WideShrinkableOppositeButton>
    </div>
  </>
}