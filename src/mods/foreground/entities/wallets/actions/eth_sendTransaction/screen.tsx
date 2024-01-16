import { BigIntToHex } from "@/libs/bigints/bigints";
import { useCopy } from "@/libs/copy/copy";
import { Errors, UIError } from "@/libs/errors/errors";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Mutators } from "@/libs/glacier/mutators";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useEffectButNotFirstTime } from "@/libs/react/effect";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Loading } from "@/libs/ui/loading/loading";
import { ExecutedTransactionData, PendingTransactionData, SignedTransactionData, TransactionData, TransactionParametersData, TransactionTrialRef } from "@/mods/background/service_worker/entities/transactions/data";
import { usePathState, useSearchState } from "@/mods/foreground/router/path/context";
import { Address, Fixed, ZeroHexString } from "@hazae41/cubane";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable, Option, Optional } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { Transaction, ethers } from "ethers";
import { SyntheticEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { UrlState } from ".";
import { useBlockByNumber } from "../../../blocks/data";
import { useEnsLookup } from "../../../names/data";
import { useNativeBalance, useNativePricedBalance } from "../../../tokens/data";
import { useTransactionWithReceipt } from "../../../transactions/data";
import { useEstimateGas, useGasPrice, useMaxPriorityFeePerGas, useNonce } from "../../../unknown/data";
import { useWalletDataContext } from "../../context";
import { EthereumWalletInstance, useEthereumContext, useEthereumContext2 } from "../../data";
import { PriceResolver } from "../../page";
import { ShrinkableContrastButtonInInputBox, ShrinkableContrastButtonInTextareaBox, ShrinkableNakedButtonInInputBox, SimpleBox, SimpleInput, SimpleTextarea, WideShrinkableContrastButton, WideShrinkableOppositeButton } from "../send";

export function WalletSendTransactionScreenValue(props: {}) {
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()

  const $state = usePathState<UrlState>()
  const [maybeTrial, setTrial] = useSearchState("trial", $state)
  const [maybeStep, setStep] = useSearchState("step", $state)
  const [maybeChain, setChain] = useSearchState("chain", $state)
  const [maybeTarget, setTarget] = useSearchState("target", $state)
  const [maybeValue, setValue] = useSearchState("value", $state)
  const [maybeNonce, setNonce] = useSearchState("nonce", $state)
  const [maybeData, setData] = useSearchState("data", $state)
  const [maybeGasMode, setGasMode] = useSearchState("gasMode", $state)
  const [maybeGasLimit, setGasLimit] = useSearchState("gasLimit", $state)
  const [maybeGasPrice, setGasPrice] = useSearchState("gasPrice", $state)
  const [maybeBaseFeePerGas, setBaseFeePerGas] = useSearchState("baseFeePerGas", $state)
  const [maybeMaxPriorityFeePerGas, setMaxPriorityFeePerGas] = useSearchState("maxPriorityFeePerGas", $state)
  const [maybeDisableTarget, setDisableTarget] = useSearchState("disableTarget", $state)
  const [maybeDisableValue, setDisableValue] = useSearchState("disableValue", $state)
  const [maybeDisableData, setDisableData] = useSearchState("disableData", $state)
  const [maybeDisableSign, setDisableSign] = useSearchState("disableSign", $state)

  const gasMode = Option.wrap(maybeGasMode).unwrapOr("normal")

  const trialUuidFallback = useConstant(() => crypto.randomUUID())
  const trialUuid = Option.wrap(maybeTrial).unwrapOr(trialUuidFallback)

  const disableTarget = Boolean(maybeDisableTarget)
  const disableValue = Boolean(maybeDisableValue)
  const disableData = Boolean(maybeDisableData)
  const disableSign = Boolean(maybeDisableSign)

  const chain = Option.unwrap(maybeChain)
  const chainData = chainByChainId[Number(chain)]
  const tokenData = chainData.token

  const context = useEthereumContext2(wallet.uuid, chainData).unwrap()

  const transactionUuid = useConstant(() => crypto.randomUUID())
  const transactionQuery = useTransactionWithReceipt(transactionUuid, context)
  const maybeTransaction = transactionQuery.current?.ok().get()

  const pendingNonceQuery = useNonce(wallet.address, context)
  const maybePendingNonce = pendingNonceQuery.current?.ok().get()

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

  const onValuedChange = useCallback((input: string) => {
    try {
      if (input.trim().length === 0) {
        setRawPricedInput(undefined)
        return
      }

      if (maybePrice == null) {
        setRawPricedInput(undefined)
        return
      }

      const priced = Fixed.fromString(input, tokenData.decimals).mul(maybePrice)

      if (priced.value === 0n) {
        setRawPricedInput(undefined)
        return
      }

      setRawPricedInput(priced.toString())
    } catch (e: unknown) {
      setRawPricedInput(undefined)
      return
    }
  }, [maybePrice, tokenData])

  const onPricedChange = useCallback((input: string) => {
    try {
      if (input.trim().length === 0) {
        setRawValuedInput(undefined)
        return
      }

      if (maybePrice == null) {
        setRawValuedInput(undefined)
        return
      }

      const valued = Fixed.fromString(input, tokenData.decimals).div(maybePrice)

      if (valued.value === 0n) {
        setRawValuedInput(undefined)
        return
      }

      setRawValuedInput(valued.toString())
    } catch (e: unknown) {
      setRawValuedInput(undefined)
      return
    }
  }, [maybePrice, tokenData])

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
    if (disableValue)
      return
    if (valuedBalanceData == null)
      return
    setRawValued(Fixed.from(valuedBalanceData).toString())
  }, [disableValue, valuedBalanceData, setRawValued])

  const onPricedMaxClick = useCallback(() => {
    if (disableValue)
      return
    if (pricedBalanceData == null)
      return
    setRawPriced(Fixed.from(pricedBalanceData).toString())
  }, [disableValue, pricedBalanceData, setRawPriced])

  const onValuedPaste = useCallback(async () => {
    if (disableValue)
      return
    setRawValued(await navigator.clipboard.readText())
  }, [disableValue, setRawValued])

  const onPricedPaste = useCallback(async () => {
    if (disableValue)
      return
    setRawPriced(await navigator.clipboard.readText())
  }, [disableValue, setRawPriced])

  const onValuedClear = useCallback(async () => {
    if (disableValue)
      return
    setRawValued("")
  }, [disableValue, setRawValued])

  const onPricedClear = useCallback(async () => {
    if (disableValue)
      return
    setRawPriced("")
  }, [disableValue, setRawPriced])

  const onTargetFocus = useCallback(() => {
    if (disableValue)
      return
    setStep("target")
  }, [disableValue, setStep])

  const onNonceClick = useCallback(() => {
    if (disableValue)
      return
    setStep("nonce")
  }, [disableValue, setStep])

  const onPricedClick = useCallback(() => {
    if (disableValue)
      return
    setMode("priced")
  }, [disableValue])

  const onValuedClick = useCallback(() => {
    if (disableValue)
      return
    setMode("valued")
  }, [disableValue])

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

  const [rawNonceInput = "", setRawNonceInput] = useState<Optional<string>>(maybeNonce)

  const onNonceInputChange = useInputChange(e => {
    setRawNonceInput(e.target.value)
  }, [])

  const nonceInput = useDeferredValue(rawNonceInput)

  useEffectButNotFirstTime(() => {
    setNonce(nonceInput)
  }, [nonceInput])

  const maybeCustomNonce = useMemo(() => {
    try {
      return maybeNonce?.trim().length
        ? BigInt(maybeNonce.trim())
        : undefined
    } catch { }
  }, [maybeNonce])

  const maybeFinalNonce = useMemo(() => {
    if (maybeCustomNonce != null)
      return maybeCustomNonce
    if (maybePendingNonce != null)
      return maybePendingNonce
    return undefined
  }, [maybeCustomNonce, maybePendingNonce])

  const [rawDataInput = "", setRawDataInput] = useState<Optional<string>>(maybeData)

  const onDataInputChange = useTextAreaChange(e => {
    setRawDataInput(e.target.value)
  }, [])

  const dataInput = useDeferredValue(rawDataInput)

  useEffectButNotFirstTime(() => {
    setData(dataInput)
  }, [dataInput])

  const maybeTriedMaybeFinalData = useMemo(() => Result.runAndDoubleWrapSync(() => {
    return maybeData?.trim().length
      ? ZeroHexString.from(maybeData.trim())
      : undefined
  }), [maybeData])

  const onGasModeChange = useCallback((e: SyntheticEvent<HTMLSelectElement>) => {
    setGasMode(e.currentTarget.value)
  }, [setGasMode])

  const fetchedGasPriceQuery = useGasPrice(context)
  const maybeFetchedGasPrice = fetchedGasPriceQuery.current?.ok().get()

  const fetchedMaxPriorityFeePerGasQuery = useMaxPriorityFeePerGas(context)
  const maybeFetchedMaxPriorityFeePerGas = fetchedMaxPriorityFeePerGasQuery.current?.ok().get()

  const pendingBlockQuery = useBlockByNumber("pending", context)
  const maybePendingBlock = pendingBlockQuery.current?.ok().get()

  const maybeFetchedBaseFeePerGas = useMemo(() => {
    try {
      return maybePendingBlock?.baseFeePerGas != null
        ? BigIntToHex.decodeOrThrow(maybePendingBlock.baseFeePerGas)
        : undefined
    } catch { }
  }, [maybePendingBlock])

  const maybeIsEip1559 = useMemo(() => {
    return maybePendingBlock?.baseFeePerGas != null
  }, [maybePendingBlock])

  const [rawGasLimitInput = "", setRawGasLimitInput] = useState<Optional<string>>(maybeGasLimit)

  const onGasLimitInputChange = useInputChange(e => {
    setRawGasLimitInput(e.target.value)
  }, [])

  const gasLimitInput = useDeferredValue(rawGasLimitInput)

  useEffectButNotFirstTime(() => {
    setGasLimit(gasLimitInput)
  }, [gasLimitInput])

  const [rawGasPriceInput = "", setRawGasPriceInput] = useState<Optional<string>>(maybeGasPrice)

  const onGasPriceInputChange = useInputChange(e => {
    setRawGasPriceInput(e.target.value)
  }, [])

  const gasPriceInput = useDeferredValue(rawGasPriceInput)

  useEffectButNotFirstTime(() => {
    setGasPrice(gasPriceInput)
  }, [gasPriceInput])

  const [rawBaseFeePerGasInput = "", setRawBaseFeePerGasInput] = useState<Optional<string>>(maybeBaseFeePerGas)

  const onBaseFeePerGasInputChange = useInputChange(e => {
    setRawBaseFeePerGasInput(e.target.value)
  }, [])

  const baseFeePerGasInput = useDeferredValue(rawBaseFeePerGasInput)

  useEffectButNotFirstTime(() => {
    setBaseFeePerGas(baseFeePerGasInput)
  }, [baseFeePerGasInput])

  const [rawMaxPriorityFeePerGasInput = "", setRawMaxPriorityFeePerGasInput] = useState<Optional<string>>(maybeMaxPriorityFeePerGas)

  const onMaxPriorityFeePerGasInputChange = useInputChange(e => {
    setRawMaxPriorityFeePerGasInput(e.target.value)
  }, [])

  const maxPriorityFeePerGasInput = useDeferredValue(rawMaxPriorityFeePerGasInput)

  useEffectButNotFirstTime(() => {
    setMaxPriorityFeePerGas(maxPriorityFeePerGasInput)
  }, [maxPriorityFeePerGasInput])

  function useMaybeMemo<T>(f: (x: T) => T, [x]: [Nullable<T>]) {
    return useMemo(() => {
      if (x == null)
        return undefined
      return f(x)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [x])
  }

  const maybeNormalBaseFeePerGas = useMaybeMemo((baseFeePerGas) => {
    return baseFeePerGas
  }, [maybeFetchedBaseFeePerGas])

  const maybeFastBaseFeePerGas = useMaybeMemo((baseFeePerGas) => {
    return baseFeePerGas + (1n * (10n ** 9n))
  }, [maybeFetchedBaseFeePerGas])

  const maybeUrgentBaseFeePerGas = useMaybeMemo((baseFeePerGas) => {
    return baseFeePerGas + (2n * (10n ** 9n))
  }, [maybeFetchedBaseFeePerGas])

  const maybeCustomBaseFeePerGas = useMemo(() => {
    try {
      return maybeBaseFeePerGas?.trim().length
        ? BigInt(maybeBaseFeePerGas.trim())
        : maybeNormalBaseFeePerGas
    } catch { }
  }, [maybeBaseFeePerGas, maybeNormalBaseFeePerGas])

  const maybeNormalMaxPriorityFeePerGas = useMaybeMemo((maxPriorityFeePerGas) => {
    return maxPriorityFeePerGas / 4n
  }, [maybeFetchedMaxPriorityFeePerGas])

  const maybeFastMaxPriorityFeePerGas = useMaybeMemo((maxPriorityFeePerGas) => {
    return maxPriorityFeePerGas / 2n
  }, [maybeFetchedMaxPriorityFeePerGas])

  const maybeUrgentMaxPriorityFeePerGas = useMaybeMemo((maxPriorityFeePerGas) => {
    return maxPriorityFeePerGas
  }, [maybeFetchedMaxPriorityFeePerGas])

  const maybeCustomMaxPriorityFeePerGas = useMemo(() => {
    try {
      return maybeMaxPriorityFeePerGas?.trim().length
        ? BigInt(maybeMaxPriorityFeePerGas.trim())
        : maybeNormalMaxPriorityFeePerGas
    } catch { }
  }, [maybeMaxPriorityFeePerGas, maybeNormalMaxPriorityFeePerGas])

  const maybeNormalGasPrice = useMaybeMemo((gasPrice) => {
    return gasPrice
  }, [maybeFetchedGasPrice])

  const maybeFastGasPrice = useMaybeMemo((gasPrice) => {
    return (gasPrice * 110n) / 100n
  }, [maybeFetchedGasPrice])

  const maybeUrgentGasPrice = useMaybeMemo((gasPrice) => {
    return (gasPrice * 120n) / 100n
  }, [maybeFetchedGasPrice])

  const maybeCustomGasPrice = useMemo(() => {
    try {
      return maybeGasPrice?.trim().length
        ? BigInt(maybeGasPrice.trim())
        : maybeNormalGasPrice
    } catch { }
  }, [maybeGasPrice, maybeNormalGasPrice])

  const maybeNormalMinFeePerGas = useMemo(() => {
    if (maybeNormalBaseFeePerGas == null)
      return undefined
    if (maybeNormalMaxPriorityFeePerGas == null)
      return undefined
    return maybeNormalBaseFeePerGas + maybeNormalMaxPriorityFeePerGas
  }, [maybeNormalBaseFeePerGas, maybeNormalMaxPriorityFeePerGas])

  const maybeFastMinFeePerGas = useMemo(() => {
    if (maybeFastBaseFeePerGas == null)
      return undefined
    if (maybeFastMaxPriorityFeePerGas == null)
      return undefined
    return maybeFastBaseFeePerGas + maybeFastMaxPriorityFeePerGas
  }, [maybeFastBaseFeePerGas, maybeFastMaxPriorityFeePerGas])

  const maybeUrgentMinFeePerGas = useMemo(() => {
    if (maybeUrgentBaseFeePerGas == null)
      return undefined
    if (maybeUrgentMaxPriorityFeePerGas == null)
      return undefined
    return maybeUrgentBaseFeePerGas + maybeUrgentMaxPriorityFeePerGas
  }, [maybeUrgentBaseFeePerGas, maybeUrgentMaxPriorityFeePerGas])

  const maybeCustomMinFeePerGas = useMemo(() => {
    if (maybeCustomBaseFeePerGas == null)
      return undefined
    if (maybeCustomMaxPriorityFeePerGas == null)
      return undefined
    return maybeCustomBaseFeePerGas + maybeCustomMaxPriorityFeePerGas
  }, [maybeCustomBaseFeePerGas, maybeCustomMaxPriorityFeePerGas])

  const maybeNormalMaxFeePerGas = useMemo(() => {
    if (maybeNormalBaseFeePerGas == null)
      return undefined
    if (maybeNormalMaxPriorityFeePerGas == null)
      return undefined
    return (maybeNormalBaseFeePerGas * 2n) + maybeNormalMaxPriorityFeePerGas
  }, [maybeNormalBaseFeePerGas, maybeNormalMaxPriorityFeePerGas])

  const maybeFastMaxFeePerGas = useMemo(() => {
    if (maybeFastBaseFeePerGas == null)
      return undefined
    if (maybeFastMaxPriorityFeePerGas == null)
      return undefined
    return (maybeFastBaseFeePerGas * 2n) + maybeFastMaxPriorityFeePerGas
  }, [maybeFastBaseFeePerGas, maybeFastMaxPriorityFeePerGas])

  const maybeUrgentMaxFeePerGas = useMemo(() => {
    if (maybeUrgentBaseFeePerGas == null)
      return undefined
    if (maybeUrgentMaxPriorityFeePerGas == null)
      return undefined
    return (maybeUrgentBaseFeePerGas * 2n) + maybeUrgentMaxPriorityFeePerGas
  }, [maybeUrgentBaseFeePerGas, maybeUrgentMaxPriorityFeePerGas])

  const maybeCustomMaxFeePerGas = useMemo(() => {
    if (maybeCustomBaseFeePerGas == null)
      return undefined
    if (maybeCustomMaxPriorityFeePerGas == null)
      return undefined
    return (maybeCustomBaseFeePerGas * 2n) + maybeCustomMaxPriorityFeePerGas
  }, [maybeCustomBaseFeePerGas, maybeCustomMaxPriorityFeePerGas])

  function useMode<T>(normal: Nullable<T>, fast: Nullable<T>, urgent: Nullable<T>, custom: Nullable<T>) {
    return useMemo(() => {
      if (gasMode === "normal")
        return normal
      if (gasMode === "fast")
        return fast
      if (gasMode === "urgent")
        return urgent
      if (gasMode === "custom")
        return custom
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gasMode, normal, fast, urgent, custom])
  }

  function useGasDisplay(gasPrice: Nullable<bigint>) {
    return useMemo(() => {
      if (gasPrice == null)
        return "???"
      return Number(new Fixed(gasPrice, 9).move(4).toString()).toLocaleString(undefined, { maximumSignificantDigits: 2 })
    }, [gasPrice])
  }

  function useCompactUsdDisplay(fixed: Nullable<Fixed>) {
    return useMemo(() => {
      if (fixed == null)
        return "???"
      return Number(fixed.move(2).toString()).toLocaleString(undefined, { style: "currency", currency: "USD", notation: "compact" })
    }, [fixed])
  }

  const maybeFinalGasPrice = useMode(maybeNormalGasPrice, maybeFastGasPrice, maybeUrgentGasPrice, maybeCustomGasPrice)
  const maybeFinalMaxFeePerGas = useMode(maybeNormalMaxFeePerGas, maybeFastMaxFeePerGas, maybeUrgentMaxFeePerGas, maybeCustomMaxFeePerGas)
  const maybeFinalMaxPriorityFeePerGas = useMode(maybeNormalMaxPriorityFeePerGas, maybeFastMaxPriorityFeePerGas, maybeUrgentMaxPriorityFeePerGas, maybeCustomMaxPriorityFeePerGas)

  const maybeTriedLegacyGasLimitKey = useMemo(() => {
    if (maybeIsEip1559 !== false)
      return undefined
    if (maybeFinalTarget == null)
      return undefined
    if (maybeFinalValue == null)
      return undefined
    if (maybeFinalNonce == null)
      return undefined
    if (maybeFinalGasPrice == null)
      return undefined
    if (maybeTriedMaybeFinalData == null)
      return undefined
    if (maybeTriedMaybeFinalData.isErr())
      return maybeTriedMaybeFinalData

    const key = {
      method: "eth_estimateGas",
      params: [{
        chainId: ZeroHexString.from(chainData.chainId),
        from: wallet.address,
        to: maybeFinalTarget,
        gasPrice: ZeroHexString.from(maybeFinalGasPrice),
        value: ZeroHexString.from(maybeFinalValue.value),
        nonce: ZeroHexString.from(maybeFinalNonce),
        data: maybeTriedMaybeFinalData.get()
      }, "latest"]
    } satisfies RpcRequestPreinit<[unknown, unknown]>

    return new Ok(key)
  }, [wallet, chainData, maybeIsEip1559, maybeFinalTarget, maybeFinalValue, maybeFinalNonce, maybeTriedMaybeFinalData, maybeFinalGasPrice])

  const maybeTriedEip1559GasLimitKey = useMemo(() => {
    if (maybeIsEip1559 !== true)
      return undefined
    if (maybeFinalTarget == null)
      return undefined
    if (maybeFinalValue == null)
      return undefined
    if (maybeFinalNonce == null)
      return undefined
    if (maybeFinalMaxFeePerGas == null)
      return undefined
    if (maybeFinalMaxPriorityFeePerGas == null)
      return undefined
    if (maybeTriedMaybeFinalData == null)
      return undefined
    if (maybeTriedMaybeFinalData.isErr())
      return maybeTriedMaybeFinalData

    const key = {
      method: "eth_estimateGas",
      params: [{
        chainId: ZeroHexString.from(chainData.chainId),
        from: wallet.address,
        to: maybeFinalTarget,
        maxFeePerGas: ZeroHexString.from(maybeFinalMaxFeePerGas),
        maxPriorityFeePerGas: ZeroHexString.from(maybeFinalMaxPriorityFeePerGas),
        value: ZeroHexString.from(maybeFinalValue.value),
        nonce: ZeroHexString.from(maybeFinalNonce),
        data: maybeTriedMaybeFinalData.get()
      }, "latest"]
    } satisfies RpcRequestPreinit<[unknown, unknown]>

    return new Ok(key)
  }, [wallet, chainData, maybeIsEip1559, maybeFinalTarget, maybeFinalValue, maybeFinalNonce, maybeTriedMaybeFinalData, maybeFinalMaxFeePerGas, maybeFinalMaxPriorityFeePerGas])

  const maybeLegacyGasLimitKey = maybeTriedLegacyGasLimitKey?.ok().get()
  const maybeEip1559GasLimitKey = maybeTriedEip1559GasLimitKey?.ok().get()

  const legacyGasLimitQuery = useEstimateGas(maybeLegacyGasLimitKey, context)
  const maybeLegacyGasLimit = legacyGasLimitQuery.current?.ok().get()

  const eip1559GasLimitQuery = useEstimateGas(maybeEip1559GasLimitKey, context)
  const maybeEip1559GasLimit = eip1559GasLimitQuery.current?.ok().get()

  const maybeFetchedGasLimit = useMemo(() => {
    if (maybeIsEip1559 == null)
      return undefined
    if (maybeLegacyGasLimit != null)
      return maybeLegacyGasLimit
    if (maybeEip1559GasLimit != null)
      return maybeEip1559GasLimit
    return undefined
  }, [maybeIsEip1559, maybeLegacyGasLimit, maybeEip1559GasLimit])

  const maybeCustomGasLimit = useMemo(() => {
    try {
      return maybeGasLimit?.trim().length
        ? BigInt(maybeGasLimit.trim())
        : maybeFetchedGasLimit
    } catch { }
  }, [maybeGasLimit, maybeFetchedGasLimit])

  const maybeFinalGasLimit = useMemo(() => {
    if (gasMode === "custom")
      return maybeCustomGasLimit
    return maybeFetchedGasLimit
  }, [gasMode, maybeCustomGasLimit, maybeFetchedGasLimit])

  const maybeNormalLegacyGasCost = useMemo(() => {
    if (maybeLegacyGasLimit == null)
      return undefined
    if (maybeNormalGasPrice == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeLegacyGasLimit * maybeNormalGasPrice, 18).mul(maybePrice)
  }, [maybeLegacyGasLimit, maybeNormalGasPrice, maybePrice])

  const maybeFastLegacyGasCost = useMemo(() => {
    if (maybeLegacyGasLimit == null)
      return undefined
    if (maybeFastGasPrice == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeLegacyGasLimit * maybeFastGasPrice, 18).mul(maybePrice)
  }, [maybeLegacyGasLimit, maybeFastGasPrice, maybePrice])

  const maybeUrgentLegacyGasCost = useMemo(() => {
    if (maybeLegacyGasLimit == null)
      return undefined
    if (maybeUrgentGasPrice == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeLegacyGasLimit * maybeUrgentGasPrice, 18).mul(maybePrice)
  }, [maybeLegacyGasLimit, maybeUrgentGasPrice, maybePrice])

  const maybeCustomLegacyGasCost = useMemo(() => {
    if (maybeCustomGasLimit == null)
      return undefined
    if (maybeCustomGasPrice == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeCustomGasLimit * maybeCustomGasPrice, 18).mul(maybePrice)
  }, [maybeCustomGasLimit, maybeCustomGasPrice, maybePrice])

  const maybeNormalMinEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimit == null)
      return undefined
    if (maybeNormalMinFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimit * maybeNormalMinFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimit, maybeNormalMinFeePerGas, maybePrice])

  const maybeFastMinEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimit == null)
      return undefined
    if (maybeFastMinFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimit * maybeFastMinFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimit, maybeFastMinFeePerGas, maybePrice])

  const maybeUrgentMinEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimit == null)
      return undefined
    if (maybeUrgentMinFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimit * maybeUrgentMinFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimit, maybeUrgentMinFeePerGas, maybePrice])

  const maybeCustomMinEip1559GasCost = useMemo(() => {
    if (maybeCustomGasLimit == null)
      return undefined
    if (maybeCustomMinFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeCustomGasLimit * maybeCustomMinFeePerGas, 18).mul(maybePrice)
  }, [maybeCustomGasLimit, maybeCustomMinFeePerGas, maybePrice])

  const maybeNormalMaxEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimit == null)
      return undefined
    if (maybeNormalMaxFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimit * maybeNormalMaxFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimit, maybeNormalMaxFeePerGas, maybePrice])

  const maybeFastMaxEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimit == null)
      return undefined
    if (maybeFastMaxFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimit * maybeFastMaxFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimit, maybeFastMaxFeePerGas, maybePrice])

  const maybeUrgentMaxEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimit == null)
      return undefined
    if (maybeUrgentMaxFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimit * maybeUrgentMaxFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimit, maybeUrgentMaxFeePerGas, maybePrice])

  const maybeCustomMaxEip1559GasCost = useMemo(() => {
    if (maybeCustomGasLimit == null)
      return undefined
    if (maybeCustomMaxFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeCustomGasLimit * maybeCustomMaxFeePerGas, 18).mul(maybePrice)
  }, [maybeCustomGasLimit, maybeCustomMaxFeePerGas, maybePrice])

  const maybeFinalLegacyGasCost = useMode(maybeNormalLegacyGasCost, maybeFastLegacyGasCost, maybeUrgentLegacyGasCost, maybeCustomLegacyGasCost)
  const maybeFinalMinEip1559GasCost = useMode(maybeNormalMinEip1559GasCost, maybeFastMinEip1559GasCost, maybeUrgentMinEip1559GasCost, maybeCustomMinEip1559GasCost)
  const maybeFinalMaxEip1559GasCost = useMode(maybeNormalMaxEip1559GasCost, maybeFastMaxEip1559GasCost, maybeUrgentMaxEip1559GasCost, maybeCustomMaxEip1559GasCost)

  const normalLegacyGasCostDisplay = useCompactUsdDisplay(maybeNormalLegacyGasCost)
  const fastLegacyGasCostDisplay = useCompactUsdDisplay(maybeFastLegacyGasCost)
  const urgentLegacyGasCostDisplay = useCompactUsdDisplay(maybeUrgentLegacyGasCost)
  const finalLegacyGasCostDisplay = useCompactUsdDisplay(maybeFinalLegacyGasCost)

  const normalMinEip1559GasCostDisplay = useCompactUsdDisplay(maybeNormalMinEip1559GasCost)
  const fastMinEip1559GasCostDisplay = useCompactUsdDisplay(maybeFastMinEip1559GasCost)
  const urgentMinEip1559GasCostDisplay = useCompactUsdDisplay(maybeUrgentMinEip1559GasCost)
  const finalMinEip1559GasCostDisplay = useCompactUsdDisplay(maybeFinalMinEip1559GasCost)

  const normalMaxEip1559GasCostDisplay = useCompactUsdDisplay(maybeNormalMaxEip1559GasCost)
  const fastMaxEip1559GasCostDisplay = useCompactUsdDisplay(maybeFastMaxEip1559GasCost)
  const urgentMaxEip1559GasCostDisplay = useCompactUsdDisplay(maybeUrgentMaxEip1559GasCost)
  const finalMaxEip1559GasCostDisplay = useCompactUsdDisplay(maybeFinalMaxEip1559GasCost)

  const normalGasPriceDisplay = useGasDisplay(maybeNormalGasPrice)
  const fastGasPriceDisplay = useGasDisplay(maybeFastGasPrice)
  const urgentGasPriceDisplay = useGasDisplay(maybeUrgentGasPrice)

  const normalBaseFeePerGasDisplay = useGasDisplay(maybeNormalBaseFeePerGas)
  const fastBaseFeePerGasDisplay = useGasDisplay(maybeFastBaseFeePerGas)
  const urgentBaseFeePerGasDisplay = useGasDisplay(maybeUrgentBaseFeePerGas)

  const normalMaxPriorityFeePerGasDisplay = useGasDisplay(maybeNormalMaxPriorityFeePerGas)
  const fastMaxPriorityFeePerGasDisplay = useGasDisplay(maybeFastMaxPriorityFeePerGas)
  const urgentMaxPriorityFeePerGasDisplay = useGasDisplay(maybeUrgentMaxPriorityFeePerGas)

  const signOrSend = useCallback(async (action: "sign" | "send") => {
    try {
      if (maybeIsEip1559 == null)
        return

      const target = Option.wrap(maybeFinalTarget).okOrElseSync(() => {
        return new UIError(`Could not parse or fetch address`)
      }).unwrap()

      const value = Option.wrap(maybeFinalValue).okOrElseSync(() => {
        return new UIError(`Could not parse value`)
      }).unwrap()

      const nonce = Option.wrap(maybeFinalNonce).okOrElseSync(() => {
        return new UIError(`Could not parse or fetch nonce`)
      }).unwrap()

      const data = Option.wrap(maybeTriedMaybeFinalData).andThenSync(x => x.ok()).okOrElseSync(() => {
        return new UIError(`Could not parse or encode data`)
      }).unwrap()

      const gasLimit = Option.wrap(maybeFinalGasLimit).okOrElseSync(() => {
        return new UIError(`Could not fetch gasLimit`)
      }).unwrap()

      let tx: ethers.Transaction
      let params: TransactionParametersData

      /**
       * EIP-1559
       */
      if (maybeIsEip1559) {
        const maxFeePerGas = Option.wrap(maybeFinalMaxFeePerGas).okOrElseSync(() => {
          return new UIError(`Could not fetch baseFeePerGas`)
        }).unwrap()

        const maxPriorityFeePerGas = Option.wrap(maybeFinalMaxPriorityFeePerGas).okOrElseSync(() => {
          return new UIError(`Could not fetch maxPriorityFeePerGas`)
        }).unwrap()

        tx = Transaction.from({
          to: Address.fromOrThrow(target),
          gasLimit: gasLimit,
          chainId: chainData.chainId,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas,
          nonce: Number(nonce),
          value: value.value,
          data: data
        })

        params = {
          from: wallet.address,
          to: Address.fromOrThrow(target),
          gas: ZeroHexString.from(gasLimit),
          maxFeePerGas: ZeroHexString.from(maxFeePerGas),
          maxPriorityFeePerGas: ZeroHexString.from(maxPriorityFeePerGas),
          value: ZeroHexString.from(value.value),
          nonce: ZeroHexString.from(nonce),
          data: data
        }
      }

      /**
       * Not EIP-1559
       */
      else {
        const gasPrice = Option.wrap(maybeFinalGasPrice).okOrElseSync(() => {
          return new UIError(`Could not fetch gasPrice`)
        }).unwrap()

        tx = Transaction.from({
          to: Address.from(target),
          gasLimit: gasLimit,
          chainId: chainData.chainId,
          gasPrice: gasPrice,
          nonce: Number(nonce),
          value: value.value,
          data: data
        })

        params = {
          from: wallet.address,
          to: Address.fromOrThrow(target),
          gas: ZeroHexString.from(gasLimit),
          gasPrice: ZeroHexString.from(gasPrice),
          value: ZeroHexString.from(value.value),
          nonce: ZeroHexString.from(nonce),
          data: data
        }
      }

      const instance = await EthereumWalletInstance.tryFrom(wallet, context.background).then(r => r.unwrap())
      const signature = await instance.trySignTransaction(tx, context.background).then(r => r.unwrap())

      tx.signature = signature

      if (action === "sign") {
        const { chainId } = chainData

        const uuid = transactionUuid
        const hash = tx.hash as ZeroHexString
        const data = tx.serialized as ZeroHexString
        const trial = TransactionTrialRef.create(trialUuid)

        await transactionQuery.mutate(Mutators.data<TransactionData, never>({ type: "signed", uuid, trial, chainId, hash, data, params }))
        return
      }

      if (action === "send") {
        const { chainId } = chainData

        const uuid = transactionUuid
        const hash = tx.hash as ZeroHexString
        const data = tx.serialized as ZeroHexString
        const trial = TransactionTrialRef.create(trialUuid)

        await context.background.tryRequest<ZeroHexString>({
          method: "brume_eth_fetch2",
          params: [context.uuid, context.chain.chainId, {
            method: "eth_sendRawTransaction",
            params: [data],
            noCheck: true
          }]
        }).then(r => r.unwrap().unwrap())

        await transactionQuery.mutate(Mutators.data<TransactionData, never>({ type: "pending", uuid, trial, chainId, hash, data, params }))
        return
      }
    } catch (e) {
      Errors.logAndAlert(e)
    }
  }, [wallet, context, trialUuid, transactionUuid, transactionQuery, chainData, maybeFinalTarget, maybeFinalValue, maybeFinalNonce, maybeTriedMaybeFinalData, maybeIsEip1559, maybeFinalGasLimit, maybeFinalMaxFeePerGas, maybeFinalMaxPriorityFeePerGas, maybeFinalGasPrice])

  const onSignClick = useAsyncUniqueCallback(async () => {
    return await signOrSend("sign")
  }, [signOrSend])

  const onSendClick = useAsyncUniqueCallback(async () => {
    return await signOrSend("send")
  }, [signOrSend])

  return <>
    {tokenData.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        ok={onPrice} />)}
    <Dialog.Title close={close}>
      Transact on {chainData.name}
    </Dialog.Title>
    <div className="h-4" />
    <SimpleBox>
      <div className="">
        Target
      </div>
      <div className="w-4" />
      <SimpleInput key="target"
        disabled={disableTarget}
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
              disabled={disableValue}
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
        {!disableValue && <>
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
        </>}
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
              disabled={disableValue}
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
        {!disableValue && <>
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
        </>}
      </SimpleBox>}
    <div className="h-4" />
    <div className="font-medium">
      Advanced
    </div>
    <div className="h-2" />
    <SimpleBox>
      <div className="">
        Nonce
      </div>
      <div className="w-4" />
      <SimpleInput
        value={rawNonceInput}
        onChange={onNonceInputChange}
        placeholder={maybePendingNonce?.toString()} />
      <div className="w-1" />
      <ShrinkableContrastButtonInInputBox
        onClick={onNonceClick}>
        Select
      </ShrinkableContrastButtonInInputBox>
    </SimpleBox>
    <div className="h-2" />
    <div className="po-md flex flex-col bg-contrast rounded-xl">
      <div className="flex items-start">
        <div className="">
          Data
        </div>
        <div className="w-4" />
        <SimpleTextarea
          disabled={disableData}
          rows={3}
          value={rawDataInput}
          onChange={onDataInputChange}
          placeholder="0x0" />
      </div>
      <div className="h-2" />
      <ShrinkableContrastButtonInTextareaBox>
        <Outline.MagnifyingGlassIcon className="size-4" />
        Decode
      </ShrinkableContrastButtonInTextareaBox>
    </div>
    <div className="h-4" />
    <div className="font-medium">
      Gas
    </div>
    <div className="h-2" />
    <SimpleBox>
      <div className="">
        Gas
      </div>
      <div className="w-4" />
      {maybeIsEip1559 === true &&
        <select className="w-full my-0.5 bg-transparent outline-none"
          value={gasMode}
          onChange={onGasModeChange}>
          <option value="urgent">
            {`Urgent — ${urgentBaseFeePerGasDisplay}:${urgentMaxPriorityFeePerGasDisplay} Gwei — ${urgentMinEip1559GasCostDisplay}-${urgentMaxEip1559GasCostDisplay}`}
          </option>
          <option value="fast">
            {`Fast — ${fastBaseFeePerGasDisplay}:${fastMaxPriorityFeePerGasDisplay} Gwei — ${fastMinEip1559GasCostDisplay}-${fastMaxEip1559GasCostDisplay}`}
          </option>
          <option value="normal">
            {`Normal — ${normalBaseFeePerGasDisplay}:${normalMaxPriorityFeePerGasDisplay} Gwei — ${normalMinEip1559GasCostDisplay}-${normalMaxEip1559GasCostDisplay}`}
          </option>
          <option value="custom">
            Custom
          </option>
        </select>}
      {maybeIsEip1559 === false &&
        <select className="w-full my-0.5 bg-transparent outline-none"
          value={gasMode}
          onChange={onGasModeChange}>
          <option value="urgent">
            {`Urgent — ${urgentGasPriceDisplay} Gwei — ${urgentLegacyGasCostDisplay}`}
          </option>
          <option value="fast">
            {`Fast — ${fastGasPriceDisplay} Gwei — ${fastLegacyGasCostDisplay}`}
          </option>
          <option value="normal">
            {`Normal — ${normalGasPriceDisplay} Gwei — ${normalLegacyGasCostDisplay}`}
          </option>
          <option value="custom">
            Custom
          </option>
        </select>}
    </SimpleBox>
    {gasMode === "custom" && maybeIsEip1559 === false && <>
      <div className="h-2" />
      <SimpleBox>
        <div className="">
          Gas Limit
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawGasLimitInput}
          onChange={onGasLimitInputChange}
          placeholder={maybeFetchedGasLimit?.toString()} />
      </SimpleBox>
      <div className="h-2" />
      <SimpleBox>
        <div className="">
          Gas Price
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawGasPriceInput}
          onChange={onGasPriceInputChange}
          placeholder={maybeFetchedGasPrice?.toString()} />
      </SimpleBox>
    </>}
    {gasMode === "custom" && maybeIsEip1559 === true && <>
      <div className="h-2" />
      <SimpleBox>
        <div className="">
          Gas Limit
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawGasLimitInput}
          onChange={onGasLimitInputChange}
          placeholder={maybeFetchedGasLimit?.toString()} />
      </SimpleBox>
      <div className="h-2" />
      <SimpleBox>
        <div className="">
          Base Fee Per Gas
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawBaseFeePerGasInput}
          onChange={onBaseFeePerGasInputChange}
          placeholder={maybeFetchedBaseFeePerGas?.toString()} />
      </SimpleBox>
      <div className="h-2" />
      <SimpleBox>
        <div className="">
          Max Priority Fee Per Gas
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawMaxPriorityFeePerGasInput}
          onChange={onMaxPriorityFeePerGasInputChange}
          placeholder={maybeFetchedMaxPriorityFeePerGas?.toString()} />
      </SimpleBox>
    </>}
    {maybeIsEip1559 === false && maybeFinalLegacyGasCost != null && <>
      <div className="h-2" />
      <div className="text-contrast">
        This transaction is expected to cost {finalLegacyGasCostDisplay}
      </div>
    </>}
    {maybeIsEip1559 === true && maybeFinalMinEip1559GasCost != null && maybeFinalMaxEip1559GasCost != null && <>
      <div className="h-2" />
      <div className="text-contrast">
        This transaction is expected to cost {finalMinEip1559GasCostDisplay} but can cost up to {finalMaxEip1559GasCostDisplay}
      </div>
    </>}
    <div className="h-4 grow" />
    {maybeTransaction?.type === "signed" && <>
      <SignedTransactionCard
        data={maybeTransaction}
        onSend={() => { }} />
      <div className="h-2" />
      {maybeTriedEip1559GasLimitKey?.isErr() && <>
        <div className="po-md flex items-center bg-contrast rounded-xl text-red-500">
          {maybeTriedEip1559GasLimitKey.getErr()?.message}
        </div>
        <div className="h-2" />
      </>}
      {maybeTriedLegacyGasLimitKey?.isErr() && <>
        <div className="po-md flex items-center bg-contrast rounded-xl text-red-500">
          {maybeTriedLegacyGasLimitKey.getErr()?.message}
        </div>
        <div className="h-2" />
      </>}
      {eip1559GasLimitQuery.current?.isErr() && <>
        <div className="po-md flex items-center bg-contrast rounded-xl text-red-500">
          {eip1559GasLimitQuery.current.getErr()?.message}
        </div>
        <div className="h-2" />
      </>}
      {legacyGasLimitQuery.current?.isErr() && <>
        <div className="po-md flex items-center bg-contrast rounded-xl text-red-500">
          {legacyGasLimitQuery.current.getErr()?.message}
        </div>
        <div className="h-2" />
      </>}
      <div className="flex items-center gap-2">
        {!disableSign &&
          <WideShrinkableContrastButton
            disabled={onSignClick.loading}
            onClick={onSignClick.run}>
            <Outline.PencilIcon className="size-5" />
            Sign
          </WideShrinkableContrastButton>}
        <WideShrinkableOppositeButton
          disabled={onSendClick.loading}
          onClick={onSendClick.run}>
          <Outline.PaperAirplaneIcon className="size-5" />
          Send
        </WideShrinkableOppositeButton>
      </div>
    </>}
    {maybeTransaction?.type === "pending" && <>
      <PendingTransactionCard
        data={maybeTransaction}
        onRetry={() => { }} />
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <WideShrinkableOppositeButton
          onClick={close}>
          <Outline.CheckIcon className="size-5" />
          Close
        </WideShrinkableOppositeButton>
      </div>
    </>}
    {maybeTransaction?.type === "executed" && <>
      <ExecutedTransactionCard data={maybeTransaction} />
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <WideShrinkableOppositeButton
          onClick={close}>
          <Outline.CheckIcon className="size-5" />
          Close
        </WideShrinkableOppositeButton>
      </div>
    </>}
    {maybeTransaction == null && <>
      {maybeTriedEip1559GasLimitKey?.isErr() && <>
        <div className="po-md flex items-center bg-contrast rounded-xl text-red-500">
          {maybeTriedEip1559GasLimitKey.getErr()?.message}
        </div>
        <div className="h-2" />
      </>}
      {maybeTriedLegacyGasLimitKey?.isErr() && <>
        <div className="po-md flex items-center bg-contrast rounded-xl text-red-500">
          {maybeTriedLegacyGasLimitKey.getErr()?.message}
        </div>
        <div className="h-2" />
      </>}
      {eip1559GasLimitQuery.current?.isErr() && <>
        <div className="po-md flex items-center bg-contrast rounded-xl text-red-500">
          {eip1559GasLimitQuery.current.getErr()?.message}
        </div>
        <div className="h-2" />
      </>}
      {legacyGasLimitQuery.current?.isErr() && <>
        <div className="po-md flex items-center bg-contrast rounded-xl text-red-500">
          {legacyGasLimitQuery.current.getErr()?.message}
        </div>
        <div className="h-2" />
      </>}
      <div className="flex items-center gap-2">
        {!disableSign &&
          <WideShrinkableContrastButton
            disabled={onSignClick.loading}
            onClick={onSignClick.run}>
            <Outline.PencilIcon className="size-5" />
            Sign
          </WideShrinkableContrastButton>}
        <WideShrinkableOppositeButton
          disabled={onSendClick.loading}
          onClick={onSendClick.run}>
          <Outline.PaperAirplaneIcon className="size-5" />
          Send
        </WideShrinkableOppositeButton>
      </div>
    </>}
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