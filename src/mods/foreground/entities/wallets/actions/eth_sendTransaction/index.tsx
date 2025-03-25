import { BigIntToHex, ZeroHexBigInt } from "@/libs/bigints/bigints";
import { useCopy } from "@/libs/copy/copy";
import { Errors, UIError } from "@/libs/errors";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons";
import { nto } from "@/libs/ntu";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useEffectButNotFirstTime } from "@/libs/react/effect";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { WideClickableContrastButton, WideClickableNakedMenuButton, WideClickableOppositeButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastSubtitleDiv } from "@/libs/ui/div";
import { ContrastLabel } from "@/libs/ui/label";
import { SmallUnflexLoading } from "@/libs/ui/loading";
import { Menu } from "@/libs/ui/menu";
import { SelectAndClose } from "@/libs/ui/select";
import { GapperAndClickerInAnchorDiv } from "@/libs/ui/shrinker";
import { urlOf } from "@/libs/url/url";
import { randomUUID } from "@/libs/uuid/uuid";
import { ExecutedTransactionData, PendingTransactionData, SignedTransactionData, TransactionData, TransactionParametersData, TransactionTrialRef } from "@/mods/background/service_worker/entities/transactions/data";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { useBlockByNumber } from "@/mods/universal/ethereum/mods/blocks/hooks";
import { useNativeTokenPriceV3 } from "@/mods/universal/ethereum/mods/tokens/mods/price/hooks";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext, useSearchState } from "@hazae41/chemin";
import { Address, Fixed, ZeroHexAsInteger, ZeroHexString } from "@hazae41/cubane";
import { Data } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable, Option, Some } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { Ok, Result } from "@hazae41/result";
import { Transaction, ethers } from "ethers";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useEnsLookup } from "../../../names/data";
import { useTransactionWithReceipt } from "../../../transactions/data";
import { useEstimateGas, useGasPrice, useMaxPriorityFeePerGas, useNonce } from "../../../unknown/data";
import { useWalletDataContext } from "../../context";
import { EthereumWalletInstance, useEthereumContext } from "../../data";
import { SimpleInput, SimpleTextarea } from "../send";
import { WalletDecodeDialog } from "./decode";
import { WalletNonceDialog } from "./nonce";

export function WalletTransactionDialog(props: {}) {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const close = useCloseContext().getOrThrow()

  const hash = useHashSubpath(path)

  const [maybeTrial, setTrial] = useSearchState(path, "trial")
  const [maybeChain, setChain] = useSearchState(path, "chain")
  const [maybeTarget, setTarget] = useSearchState(path, "target")
  const [maybeValue, setValue] = useSearchState(path, "value")
  const [maybeNonce, setNonce] = useSearchState(path, "nonce")
  const [maybeData, setData] = useSearchState(path, "data")
  const [maybeGas, setGas] = useSearchState(path, "gas")
  const [maybeGasMode, setGasMode] = useSearchState(path, "gasMode")
  const [maybeGasPrice, setGasPrice] = useSearchState(path, "gasPrice")
  const [maybeMaxFeePerGas, setMaxFeePerGas] = useSearchState(path, "maxFeePerGas")
  const [maybeMaxPriorityFeePerGas, setMaxPriorityFeePerGas] = useSearchState(path, "maxPriorityFeePerGas")
  const [maybeDisableData, setDisableData] = useSearchState(path, "disableData")
  const [maybeDisableSign, setDisableSign] = useSearchState(path, "disableSign")

  const gasMode = Option.wrap(maybeGasMode).getOr("normal")

  const trialUuidFallback = useConstant(() => randomUUID())
  const trialUuid = Option.wrap(maybeTrial).getOr(trialUuidFallback)

  const disableData = Boolean(maybeDisableData)
  const disableSign = Boolean(maybeDisableSign)

  const chain = Option.wrap(maybeChain).getOrThrow()
  const chainData = chainDataByChainId[Number(chain)]
  const tokenData = chainData.token

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const transactionUuid = useConstant(() => randomUUID())
  const transactionQuery = useTransactionWithReceipt(transactionUuid, context)

  const pendingNonceQuery = useNonce(wallet.address, context)
  const maybePendingNonceZeroHex = pendingNonceQuery.current?.getOrNull()

  const maybePendingNonceBigInt = useMaybeMemo((nonce) => {
    return ZeroHexBigInt.from(nonce).value
  }, [maybePendingNonceZeroHex])

  const priceQuery = useNativeTokenPriceV3(context, "latest")
  const maybePrice = priceQuery.current?.mapSync(x => Fixed.from(x)).getOrNull()

  const getRawPricedInput = useCallback((rawValuedInput: string) => {
    try {
      if (rawValuedInput.trim().length === 0)
        return undefined

      if (maybePrice == null)
        return undefined

      const priced = Fixed.fromStringOrZeroHex(rawValuedInput, tokenData.decimals).mul(maybePrice)

      if (priced.value === 0n)
        return undefined

      return priced.toString()
    } catch (e: unknown) {
      return undefined
    }
  }, [maybePrice, tokenData])

  const [rawValuedInput = ""] = useMemo(() => {
    return [nto(maybeValue)]
  }, [maybeValue])

  const [rawPricedInput = ""] = useMemo(() => {
    return [getRawPricedInput(rawValuedInput)]
  }, [getRawPricedInput, rawValuedInput])

  const onNonceClick = useCallback(() => {
    location.replace(hash.go(urlOf("/nonce", {})))
  }, [hash])

  const onDecodeClick = useCallback(() => {
    if (maybeData == null)
      return
    location.replace(hash.go(urlOf("/decode", { data: maybeData })))
  }, [maybeData, hash])

  const mainnet = useEthereumContext(wallet.uuid, chainDataByChainId[1]).getOrThrow()

  const maybeEnsQueryKey = maybeTarget?.endsWith(".eth")
    ? maybeTarget
    : undefined

  const ensTargetQuery = useEnsLookup(maybeEnsQueryKey, mainnet)
  const maybeEnsTarget = ensTargetQuery.current?.getOrNull()

  const maybeFinalTarget = useMemo(() => {
    if (maybeTarget == null)
      return undefined
    if (Address.fromOrNull(maybeTarget) != null)
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
      return Fixed.fromStringOrZeroHex(rawValue, tokenData.decimals)
    } catch { }
  }, [rawValue, tokenData])

  const [rawNonceInput = "", setRawNonceInput] = useState(nto(maybeNonce))

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
    if (maybePendingNonceBigInt != null)
      return maybePendingNonceBigInt
    return undefined
  }, [maybeCustomNonce, maybePendingNonceBigInt])

  const [rawDataInput = "", setRawDataInput] = useState(nto(maybeData))

  const onDataInputChange = useTextAreaChange(e => {
    setRawDataInput(e.target.value)
  }, [])

  const dataInput = useDeferredValue(rawDataInput)

  useEffectButNotFirstTime(() => {
    setData(dataInput)
  }, [dataInput])

  const maybeTriedMaybeFinalData = useMemo(() => Result.runAndDoubleWrapSync(() => {
    return maybeData?.trim().length
      ? ZeroHexAsInteger.fromOrThrow(maybeData.trim())
      : undefined
  }), [maybeData])

  const fetchedGasPriceQuery = useGasPrice(context)
  const maybeFetchedGasPriceZeroHex = fetchedGasPriceQuery.current?.getOrNull()

  const maybeFetchedGasPriceBigInt = useMaybeMemo((gasPrice) => {
    return ZeroHexBigInt.from(gasPrice).value
  }, [maybeFetchedGasPriceZeroHex])

  const fetchedMaxPriorityFeePerGasQuery = useMaxPriorityFeePerGas(context)
  const maybeFetchedMaxPriorityFeePerGasZeroHex = fetchedMaxPriorityFeePerGasQuery.current?.getOrNull()

  const maybeFetchedMaxPriorityFeePerGasBigInt = useMaybeMemo((maxPriorityFeePerGas) => {
    return ZeroHexBigInt.from(maxPriorityFeePerGas).value
  }, [maybeFetchedMaxPriorityFeePerGasZeroHex])

  const latestBlockQuery = useBlockByNumber(context, "latest")
  const maybeLatestBlock = latestBlockQuery.current?.getOrNull()

  const maybeFetchedBaseFeePerGas = useMemo(() => {
    try {
      return maybeLatestBlock?.baseFeePerGas != null
        ? BigIntToHex.decodeOrThrow(maybeLatestBlock.baseFeePerGas)
        : undefined
    } catch { }
  }, [maybeLatestBlock])

  const maybeIsEip1559 = useMemo(() => {
    return maybeLatestBlock?.baseFeePerGas != null
  }, [maybeLatestBlock])

  const [rawGasLimitInput = "", setRawGasLimitInput] = useState(nto(maybeGas))

  const onGasLimitInputChange = useInputChange(e => {
    setRawGasLimitInput(e.target.value)
  }, [])

  const gasLimitInput = useDeferredValue(rawGasLimitInput)

  useEffectButNotFirstTime(() => {
    setGas(gasLimitInput)
  }, [gasLimitInput])

  const [rawGasPriceInput = "", setRawGasPriceInput] = useState(nto(maybeGasPrice))

  const onGasPriceInputChange = useInputChange(e => {
    setRawGasPriceInput(e.target.value)
  }, [])

  const gasPriceInput = useDeferredValue(rawGasPriceInput)

  useEffectButNotFirstTime(() => {
    setGasPrice(gasPriceInput)
  }, [gasPriceInput])

  const [rawMaxFeePerGasInput = "", setRawMaxFeePerGasInput] = useState(nto(maybeMaxFeePerGas))

  const onMaxFeePerGasInputChange = useInputChange(e => {
    setRawMaxFeePerGasInput(e.target.value)
  }, [])

  const maxFeePerGasInput = useDeferredValue(rawMaxFeePerGasInput)

  useEffectButNotFirstTime(() => {
    setMaxFeePerGas(maxFeePerGasInput)
  }, [maxFeePerGasInput])

  const [rawMaxPriorityFeePerGasInput = "", setRawMaxPriorityFeePerGasInput] = useState(nto(maybeMaxPriorityFeePerGas))

  const onMaxPriorityFeePerGasInputChange = useInputChange(e => {
    setRawMaxPriorityFeePerGasInput(e.target.value)
  }, [])

  const maxPriorityFeePerGasInput = useDeferredValue(rawMaxPriorityFeePerGasInput)

  useEffectButNotFirstTime(() => {
    setMaxPriorityFeePerGas(maxPriorityFeePerGasInput)
  }, [maxPriorityFeePerGasInput])

  function useMaybeMemo<T, U>(f: (x: T) => U, [x]: [Nullable<T>]) {
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

  const maybeNormalMaxPriorityFeePerGas = useMaybeMemo((maxPriorityFeePerGas) => {
    return maxPriorityFeePerGas / 4n
  }, [maybeFetchedMaxPriorityFeePerGasBigInt])

  const maybeFastMaxPriorityFeePerGas = useMaybeMemo((maxPriorityFeePerGas) => {
    return maxPriorityFeePerGas / 2n
  }, [maybeFetchedMaxPriorityFeePerGasBigInt])

  const maybeUrgentMaxPriorityFeePerGas = useMaybeMemo((maxPriorityFeePerGas) => {
    return maxPriorityFeePerGas
  }, [maybeFetchedMaxPriorityFeePerGasBigInt])

  const maybeCustomMaxPriorityFeePerGas = useMemo(() => {
    try {
      return maybeMaxPriorityFeePerGas?.trim().length
        ? BigInt(maybeMaxPriorityFeePerGas.trim())
        : maybeNormalMaxPriorityFeePerGas
    } catch { }
  }, [maybeMaxPriorityFeePerGas, maybeNormalMaxPriorityFeePerGas])

  const maybeNormalGasPrice = useMaybeMemo((gasPrice) => {
    return gasPrice
  }, [maybeFetchedGasPriceBigInt])

  const maybeFastGasPrice = useMaybeMemo((gasPrice) => {
    return (gasPrice * 110n) / 100n
  }, [maybeFetchedGasPriceBigInt])

  const maybeUrgentGasPrice = useMaybeMemo((gasPrice) => {
    return (gasPrice * 120n) / 100n
  }, [maybeFetchedGasPriceBigInt])

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
    try {
      return maybeMaxFeePerGas?.trim().length
        ? BigInt(maybeMaxFeePerGas.trim())
        : maybeNormalMaxFeePerGas
    } catch { }
  }, [maybeMaxFeePerGas, maybeNormalMaxFeePerGas])

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

  function useGasDisplay(gasPrice: Nullable<bigint>, locale: string) {
    return useMemo(() => {
      if (gasPrice == null)
        return "???"
      return Number(new Fixed(gasPrice, 9).move(4).toString()).toLocaleString(locale, { maximumSignificantDigits: 2 })
    }, [gasPrice, locale])
  }

  function useCompactUsdDisplay(fixed: Nullable<Fixed>, locale: string) {
    return useMemo(() => {
      if (fixed == null)
        return "???"
      return Number(fixed.move(2).toString()).toLocaleString(locale, { style: "currency", currency: "USD", notation: "compact" })
    }, [fixed, locale])
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
        chainId: ZeroHexAsInteger.fromOrThrow(chainData.chainId),
        from: wallet.address,
        to: maybeFinalTarget,
        gasPrice: ZeroHexAsInteger.fromOrThrow(maybeFinalGasPrice),
        value: ZeroHexAsInteger.fromOrThrow(maybeFinalValue.value),
        nonce: ZeroHexAsInteger.fromOrThrow(maybeFinalNonce),
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
        chainId: ZeroHexAsInteger.fromOrThrow(chainData.chainId),
        from: wallet.address,
        to: maybeFinalTarget,
        maxFeePerGas: ZeroHexAsInteger.fromOrThrow(maybeFinalMaxFeePerGas),
        maxPriorityFeePerGas: ZeroHexAsInteger.fromOrThrow(maybeFinalMaxPriorityFeePerGas),
        value: ZeroHexAsInteger.fromOrThrow(maybeFinalValue.value),
        nonce: ZeroHexAsInteger.fromOrThrow(maybeFinalNonce),
        data: maybeTriedMaybeFinalData.get()
      }, "latest"]
    } satisfies RpcRequestPreinit<[unknown, unknown]>

    return new Ok(key)
  }, [wallet, chainData, maybeIsEip1559, maybeFinalTarget, maybeFinalValue, maybeFinalNonce, maybeTriedMaybeFinalData, maybeFinalMaxFeePerGas, maybeFinalMaxPriorityFeePerGas])

  const maybeLegacyGasLimitKey = maybeTriedLegacyGasLimitKey?.getOrNull()
  const maybeEip1559GasLimitKey = maybeTriedEip1559GasLimitKey?.getOrNull()

  const legacyGasLimitQuery = useEstimateGas(maybeLegacyGasLimitKey, context)
  const maybeLegacyGasLimitZeroHex = legacyGasLimitQuery.current?.getOrNull()

  const maybeLegacyGasLimitBigInt = useMaybeMemo((gasLimit) => {
    return ZeroHexBigInt.from(gasLimit).value
  }, [maybeLegacyGasLimitZeroHex])

  const eip1559GasLimitQuery = useEstimateGas(maybeEip1559GasLimitKey, context)
  const maybeEip1559GasLimitZeroHex = eip1559GasLimitQuery.current?.getOrNull()

  const maybeEip1559GasLimitBigInt = useMaybeMemo((gasLimit) => {
    return ZeroHexBigInt.from(gasLimit).value
  }, [maybeEip1559GasLimitZeroHex])

  const maybeFetchedGasLimit = useMemo(() => {
    if (maybeIsEip1559 == null)
      return undefined
    if (maybeLegacyGasLimitBigInt != null)
      return maybeLegacyGasLimitBigInt
    if (maybeEip1559GasLimitBigInt != null)
      return maybeEip1559GasLimitBigInt
    return undefined
  }, [maybeIsEip1559, maybeLegacyGasLimitBigInt, maybeEip1559GasLimitBigInt])

  const maybeCustomGasLimit = useMemo(() => {
    try {
      return maybeGas?.trim().length
        ? BigInt(maybeGas.trim())
        : maybeFetchedGasLimit
    } catch { }
  }, [maybeGas, maybeFetchedGasLimit])

  const maybeFinalGasLimit = useMemo(() => {
    if (gasMode === "custom")
      return maybeCustomGasLimit
    return maybeFetchedGasLimit
  }, [gasMode, maybeCustomGasLimit, maybeFetchedGasLimit])

  const maybeNormalLegacyGasCost = useMemo(() => {
    if (maybeLegacyGasLimitBigInt == null)
      return undefined
    if (maybeNormalGasPrice == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeLegacyGasLimitBigInt * maybeNormalGasPrice, 18).mul(maybePrice)
  }, [maybeLegacyGasLimitBigInt, maybeNormalGasPrice, maybePrice])

  const maybeFastLegacyGasCost = useMemo(() => {
    if (maybeLegacyGasLimitBigInt == null)
      return undefined
    if (maybeFastGasPrice == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeLegacyGasLimitBigInt * maybeFastGasPrice, 18).mul(maybePrice)
  }, [maybeLegacyGasLimitBigInt, maybeFastGasPrice, maybePrice])

  const maybeUrgentLegacyGasCost = useMemo(() => {
    if (maybeLegacyGasLimitBigInt == null)
      return undefined
    if (maybeUrgentGasPrice == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeLegacyGasLimitBigInt * maybeUrgentGasPrice, 18).mul(maybePrice)
  }, [maybeLegacyGasLimitBigInt, maybeUrgentGasPrice, maybePrice])

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
    if (maybeEip1559GasLimitBigInt == null)
      return undefined
    if (maybeNormalMinFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimitBigInt * maybeNormalMinFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimitBigInt, maybeNormalMinFeePerGas, maybePrice])

  const maybeFastMinEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimitBigInt == null)
      return undefined
    if (maybeFastMinFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimitBigInt * maybeFastMinFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimitBigInt, maybeFastMinFeePerGas, maybePrice])

  const maybeUrgentMinEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimitBigInt == null)
      return undefined
    if (maybeUrgentMinFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimitBigInt * maybeUrgentMinFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimitBigInt, maybeUrgentMinFeePerGas, maybePrice])

  const maybeNormalMaxEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimitBigInt == null)
      return undefined
    if (maybeNormalMaxFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimitBigInt * maybeNormalMaxFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimitBigInt, maybeNormalMaxFeePerGas, maybePrice])

  const maybeFastMaxEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimitBigInt == null)
      return undefined
    if (maybeFastMaxFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimitBigInt * maybeFastMaxFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimitBigInt, maybeFastMaxFeePerGas, maybePrice])

  const maybeUrgentMaxEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimitBigInt == null)
      return undefined
    if (maybeUrgentMaxFeePerGas == null)
      return undefined
    if (maybePrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimitBigInt * maybeUrgentMaxFeePerGas, 18).mul(maybePrice)
  }, [maybeEip1559GasLimitBigInt, maybeUrgentMaxFeePerGas, maybePrice])

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
  const maybeFinalMinEip1559GasCost = useMode(maybeNormalMinEip1559GasCost, maybeFastMinEip1559GasCost, maybeUrgentMinEip1559GasCost, undefined)
  const maybeFinalMaxEip1559GasCost = useMode(maybeNormalMaxEip1559GasCost, maybeFastMaxEip1559GasCost, maybeUrgentMaxEip1559GasCost, maybeCustomMaxEip1559GasCost)

  const normalLegacyGasCostDisplay = useCompactUsdDisplay(maybeNormalLegacyGasCost, locale)
  const fastLegacyGasCostDisplay = useCompactUsdDisplay(maybeFastLegacyGasCost, locale)
  const urgentLegacyGasCostDisplay = useCompactUsdDisplay(maybeUrgentLegacyGasCost, locale)
  const finalLegacyGasCostDisplay = useCompactUsdDisplay(maybeFinalLegacyGasCost, locale)

  const normalMinEip1559GasCostDisplay = useCompactUsdDisplay(maybeNormalMinEip1559GasCost, locale)
  const fastMinEip1559GasCostDisplay = useCompactUsdDisplay(maybeFastMinEip1559GasCost, locale)
  const urgentMinEip1559GasCostDisplay = useCompactUsdDisplay(maybeUrgentMinEip1559GasCost, locale)
  const finalMinEip1559GasCostDisplay = useCompactUsdDisplay(maybeFinalMinEip1559GasCost, locale)

  const normalMaxEip1559GasCostDisplay = useCompactUsdDisplay(maybeNormalMaxEip1559GasCost, locale)
  const fastMaxEip1559GasCostDisplay = useCompactUsdDisplay(maybeFastMaxEip1559GasCost, locale)
  const urgentMaxEip1559GasCostDisplay = useCompactUsdDisplay(maybeUrgentMaxEip1559GasCost, locale)
  const finalMaxEip1559GasCostDisplay = useCompactUsdDisplay(maybeFinalMaxEip1559GasCost, locale)

  const normalGasPriceDisplay = useGasDisplay(maybeNormalGasPrice, locale)
  const fastGasPriceDisplay = useGasDisplay(maybeFastGasPrice, locale)
  const urgentGasPriceDisplay = useGasDisplay(maybeUrgentGasPrice, locale)

  const normalBaseFeePerGasDisplay = useGasDisplay(maybeNormalBaseFeePerGas, locale)
  const fastBaseFeePerGasDisplay = useGasDisplay(maybeFastBaseFeePerGas, locale)
  const urgentBaseFeePerGasDisplay = useGasDisplay(maybeUrgentBaseFeePerGas, locale)

  const normalMaxPriorityFeePerGasDisplay = useGasDisplay(maybeNormalMaxPriorityFeePerGas, locale)
  const fastMaxPriorityFeePerGasDisplay = useGasDisplay(maybeFastMaxPriorityFeePerGas, locale)
  const urgentMaxPriorityFeePerGasDisplay = useGasDisplay(maybeUrgentMaxPriorityFeePerGas, locale)

  const signOrSendOrAlert = useCallback((action: "sign" | "send") => Errors.runOrLogAndAlert(async () => {
    if (maybeIsEip1559 == null)
      return

    const maybeTarget = Option.wrap(maybeFinalTarget).mapSync(Address.fromOrThrow).getOrNull()

    const value = Option.wrap(maybeFinalValue).okOrElseSync(() => {
      return new UIError(`Could not parse value`)
    }).getOrThrow()

    const nonce = Option.wrap(maybeFinalNonce).okOrElseSync(() => {
      return new UIError(`Could not parse or fetch nonce`)
    }).getOrThrow()

    const data = Option.wrap(maybeTriedMaybeFinalData).andThenSync(x => x.ok()).okOrElseSync(() => {
      return new UIError(`Could not parse or encode data`)
    }).getOrThrow()

    const gasLimit = Option.wrap(maybeFinalGasLimit).okOrElseSync(() => {
      return new UIError(`Could not fetch gasLimit`)
    }).getOrThrow()

    let tx: ethers.Transaction
    let params: TransactionParametersData

    /**
     * EIP-1559
     */
    if (maybeIsEip1559) {
      const maxFeePerGas = Option.wrap(maybeFinalMaxFeePerGas).okOrElseSync(() => {
        return new UIError(`Could not fetch baseFeePerGas`)
      }).getOrThrow()

      const maxPriorityFeePerGas = Option.wrap(maybeFinalMaxPriorityFeePerGas).okOrElseSync(() => {
        return new UIError(`Could not fetch maxPriorityFeePerGas`)
      }).getOrThrow()

      tx = Transaction.from({
        to: maybeTarget,
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
        to: maybeTarget,
        gas: ZeroHexAsInteger.fromOrThrow(gasLimit),
        maxFeePerGas: ZeroHexAsInteger.fromOrThrow(maxFeePerGas),
        maxPriorityFeePerGas: ZeroHexAsInteger.fromOrThrow(maxPriorityFeePerGas),
        value: ZeroHexAsInteger.fromOrThrow(value.value),
        nonce: ZeroHexAsInteger.fromOrThrow(nonce),
        data: data
      }
    }

    /**
     * Not EIP-1559
     */
    else {
      const gasPrice = Option.wrap(maybeFinalGasPrice).okOrElseSync(() => {
        return new UIError(`Could not fetch gasPrice`)
      }).getOrThrow()

      tx = Transaction.from({
        to: maybeTarget,
        gasLimit: gasLimit,
        chainId: chainData.chainId,
        gasPrice: gasPrice,
        nonce: Number(nonce),
        value: value.value,
        data: data
      })

      params = {
        from: wallet.address,
        to: maybeTarget,
        gas: ZeroHexAsInteger.fromOrThrow(gasLimit),
        gasPrice: ZeroHexAsInteger.fromOrThrow(gasPrice),
        value: ZeroHexAsInteger.fromOrThrow(value.value),
        nonce: ZeroHexAsInteger.fromOrThrow(nonce),
        data: data
      }
    }

    const instance = await EthereumWalletInstance.createOrThrow(wallet, context.background)
    const signature = await instance.signTransactionOrThrow(tx, context.background)

    tx.signature = signature

    if (action === "sign") {
      const { chainId } = chainData

      const uuid = transactionUuid
      const hash = tx.hash as ZeroHexString
      const data = tx.serialized as ZeroHexString
      const trial = TransactionTrialRef.create(trialUuid)

      await transactionQuery.mutateOrThrow(() => new Some(new Data({ type: "signed", uuid, trial, chainId, hash, data, params } as const)))

      close()
      return
    }

    if (action === "send") {
      const { chainId } = chainData

      const uuid = transactionUuid
      const hash = tx.hash as ZeroHexString
      const data = tx.serialized as ZeroHexString
      const trial = TransactionTrialRef.create(trialUuid)

      await context.background.requestOrThrow<ZeroHexString>({
        method: "brume_eth_fetch",
        params: [context.uuid, context.chain.chainId, {
          method: "eth_sendRawTransaction",
          params: [data],
          noCheck: true
        }]
      }).then(r => r.getOrThrow())

      await transactionQuery.mutateOrThrow(() => new Some(new Data({ type: "pending", uuid, trial, chainId, hash, data, params } as const)))

      close()
      return
    }
  }), [maybeIsEip1559, maybeFinalTarget, maybeFinalValue, maybeFinalNonce, maybeTriedMaybeFinalData, maybeFinalGasLimit, wallet, context.background, context.uuid, context.chain.chainId, maybeFinalMaxFeePerGas, maybeFinalMaxPriorityFeePerGas, chainData, maybeFinalGasPrice, transactionUuid, trialUuid, transactionQuery, close])

  const onSignClick = useAsyncUniqueCallback(async () => {
    return await signOrSendOrAlert("sign")
  }, [signOrSendOrAlert])

  const onSendClick = useAsyncUniqueCallback(async () => {
    return await signOrSendOrAlert("send")
  }, [signOrSendOrAlert])

  const gasGenius = useCoords(hash, "/gas")

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === "/decode" &&
        <Dialog>
          <WalletDecodeDialog />
        </Dialog>}
      {hash.url.pathname === "/nonce" &&
        <Dialog>
          <WalletNonceDialog ok={() => { }} />
        </Dialog>}
    </HashSubpathProvider>
    <Dialog.Title>
      {Locale.get({
        en: `Transact on ${chainData.name}`,
        zh: `在 ${chainData.name} 上交易`,
        hi: `${chainData.name} पर लेन-देन करें`,
        es: `Transactuar en ${chainData.name}`,
        ar: `التعامل على ${chainData.name}`,
        fr: `Transiger sur ${chainData.name}`,
        de: `Transaktion auf ${chainData.name}`,
        ru: `Транзакция на ${chainData.name}`,
        pt: `Transacionar em ${chainData.name}`,
        ja: `${chainData.name} で取引する`,
        pa: `${chainData.name} 'ਤੇ ਲੇਨ-ਦੇਨ ਕਰੋ`,
        bn: `${chainData.name} উপর লেনদেন করুন`,
        id: `Transaksi di ${chainData.name}`,
        ur: `${chainData.name} پر لین دین کریں`,
        ms: `Transaksi di ${chainData.name}`,
        it: `Transazione su ${chainData.name}`,
        tr: `${chainData.name} üzerinde işlem yapın`,
        ta: `${chainData.name} உடன் பரிவர்த்தனை செய்யவும்`,
        te: `${chainData.name} లో లేనిదానికి చేరండి`,
        ko: `${chainData.name}에서 거래`,
        vi: `Giao dịch trên ${chainData.name}`,
        pl: `Transakcja na ${chainData.name}`,
        ro: `Tranzacționați pe ${chainData.name}`,
        nl: `Transactie op ${chainData.name}`,
        el: `Συναλλαγή στο ${chainData.name}`,
        th: `ธุรกรรมใน ${chainData.name}`,
        cs: `Transakce na ${chainData.name}`,
        hu: `Tranzakció ${chainData.name} -n`,
        sv: `Transaktion på ${chainData.name}`,
        da: `Transaktion på ${chainData.name}`,
      }, locale)}
    </Dialog.Title>
    <div className="h-4" />
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Recipient, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        value={nto(maybeTarget)}
        readOnly />
    </ContrastLabel>
    <div className="h-2" />
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Amount, locale)}
      </div>
      <div className="w-4" />
      <div className="grow flex flex-col overflow-hidden">
        <div className="flex items-center">
          <SimpleInput
            readOnly
            value={rawValuedInput}
            placeholder="0.0" />
          <div className="w-1" />
          <div className="text-default-contrast">
            {tokenData.symbol}
          </div>
        </div>
        <div className="flex items-center cursor-pointer">
          <div className="text-default-contrast truncate">
            {rawPricedInput || "0.0"}
          </div>
          <div className="grow" />
          <div className="text-default-contrast">
            USD
          </div>
        </div>
      </div>
    </ContrastLabel>
    <div className="h-4" />
    <ContrastSubtitleDiv>
      {Locale.get(Locale.Advanced, locale)}
    </ContrastSubtitleDiv>
    <div className="h-2" />
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Number, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        value={rawNonceInput}
        onChange={onNonceInputChange}
        placeholder={maybePendingNonceBigInt?.toString()} />
      <div className="w-1" />
      {/* <ClickableContrastButtonInInputBox
        onClick={onNonceClick}>
        Select
      </ClickableContrastButtonInInputBox> */}
    </ContrastLabel>
    <div className="h-2" />
    <div className="po-2 flex flex-col bg-default-contrast rounded-xl">
      <div className="flex items-start">
        <div className="flex-none">
          {Locale.get(Locale.Data, locale)}
        </div>
        <div className="w-4" />
        <SimpleTextarea
          readOnly={disableData}
          rows={3}
          value={rawDataInput}
          onChange={onDataInputChange}
          placeholder="0x0" />
      </div>
      <div className="h-2" />
      <WideClickableContrastButton
        disabled={maybeData == null}
        onClick={onDecodeClick}>
        <Outline.MagnifyingGlassIcon className="size-4" />
        {Locale.get(Locale.Decode, locale)}
      </WideClickableContrastButton>
    </div>
    <div className="h-4" />
    <ContrastSubtitleDiv>
      Gas
    </ContrastSubtitleDiv>
    <div className="h-2" />
    <ContrastLabel>
      <div className="flex-none">
        Gas
      </div>
      <div className="w-4" />
      {maybeIsEip1559 === true && <>
        <HashSubpathProvider>
          {hash.url.pathname === "/gas" &&
            <Menu>
              <SelectAndClose ok={setGasMode}>
                <div className="flex flex-col text-left gap-2">
                  <WideClickableNakedMenuButton
                    aria-selected={gasMode === "urgent"}
                    data-value="urgent">
                    <div className="truncate">
                      {`${Locale.get(Locale.Urgent, locale)} — ${urgentBaseFeePerGasDisplay}:${urgentMaxPriorityFeePerGasDisplay} Gwei — ${urgentMinEip1559GasCostDisplay}-${urgentMaxEip1559GasCostDisplay}`}
                    </div>
                  </WideClickableNakedMenuButton>
                  <WideClickableNakedMenuButton
                    aria-selected={gasMode === "fast"}
                    data-value="fast">
                    <div className="truncate">
                      {`${Locale.get(Locale.Fast, locale)} — ${fastBaseFeePerGasDisplay}:${fastMaxPriorityFeePerGasDisplay} Gwei — ${fastMinEip1559GasCostDisplay}-${fastMaxEip1559GasCostDisplay}`}
                    </div>
                  </WideClickableNakedMenuButton>
                  <WideClickableNakedMenuButton
                    aria-selected={gasMode === "normal"}
                    data-value="normal">
                    <div className="truncate">
                      {`${Locale.get(Locale.Normal, locale)} — ${normalBaseFeePerGasDisplay}:${normalMaxPriorityFeePerGasDisplay} Gwei — ${normalMinEip1559GasCostDisplay}-${normalMaxEip1559GasCostDisplay}`}
                    </div>
                  </WideClickableNakedMenuButton>
                  <WideClickableNakedMenuButton
                    aria-selected={gasMode === "custom"}
                    data-value="custom">
                    <div className="truncate">
                      {Locale.get(Locale.Custom, locale)}
                    </div>
                  </WideClickableNakedMenuButton>
                </div>
              </SelectAndClose>
            </Menu>}
        </HashSubpathProvider>
        {gasMode === "urgent" &&
          <a className="truncate"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`${Locale.get(Locale.Urgent, locale)} — ${urgentBaseFeePerGasDisplay}:${urgentMaxPriorityFeePerGasDisplay} Gwei — ${urgentMinEip1559GasCostDisplay}-${urgentMaxEip1559GasCostDisplay}`}
          </a>}
        {gasMode === "fast" &&
          <a className="truncate"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`${Locale.get(Locale.Fast, locale)} — ${fastBaseFeePerGasDisplay}:${fastMaxPriorityFeePerGasDisplay} Gwei — ${fastMinEip1559GasCostDisplay}-${fastMaxEip1559GasCostDisplay}`}
          </a>}
        {gasMode === "normal" &&
          <a className="truncate"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`${Locale.get(Locale.Normal, locale)} — ${normalBaseFeePerGasDisplay}:${normalMaxPriorityFeePerGasDisplay} Gwei — ${normalMinEip1559GasCostDisplay}-${normalMaxEip1559GasCostDisplay}`}
          </a>}
        {gasMode === "custom" &&
          <a className="truncate"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {Locale.get(Locale.Custom, locale)}
          </a>}
      </>}
      {maybeIsEip1559 === false && <>
        <HashSubpathProvider>
          {hash.url.pathname === "/gas" &&
            <Menu>
              <SelectAndClose ok={setGasMode}>
                <div className="flex flex-col text-left gap-2">
                  <WideClickableNakedMenuButton
                    aria-selected={gasMode === "urgent"}
                    data-value="urgent">
                    <div className="truncate">
                      {`${Locale.get(Locale.Urgent, locale)} — ${urgentGasPriceDisplay} Gwei — ${urgentLegacyGasCostDisplay}`}
                    </div>
                  </WideClickableNakedMenuButton>
                  <WideClickableNakedMenuButton
                    aria-selected={gasMode === "fast"}
                    data-value="fast">
                    <div className="truncate">
                      {`${Locale.get(Locale.Fast, locale)} — ${fastGasPriceDisplay} Gwei — ${fastLegacyGasCostDisplay}`}
                    </div>
                  </WideClickableNakedMenuButton>
                  <WideClickableNakedMenuButton
                    aria-selected={gasMode === "normal"}
                    data-value="normal">
                    <div className="truncate">
                      {`${Locale.get(Locale.Normal, locale)} — ${normalGasPriceDisplay} Gwei — ${normalLegacyGasCostDisplay}`}
                    </div>
                  </WideClickableNakedMenuButton>
                  <WideClickableNakedMenuButton
                    aria-selected={gasMode === "custom"}
                    data-value="custom">
                    <div className="truncate">
                      {Locale.get(Locale.Custom, locale)}
                    </div>
                  </WideClickableNakedMenuButton>
                </div>
              </SelectAndClose>
            </Menu>}
        </HashSubpathProvider>
        {gasMode === "urgent" &&
          <a className="truncate"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`${Locale.get(Locale.Urgent, locale)} — ${urgentGasPriceDisplay} Gwei — ${urgentLegacyGasCostDisplay}`}
          </a>}
        {gasMode === "fast" &&
          <a className="truncate"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`${Locale.get(Locale.Fast, locale)} — ${fastGasPriceDisplay} Gwei — ${fastLegacyGasCostDisplay}`}
          </a>}
        {gasMode === "normal" &&
          <a className="truncate"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`${Locale.get(Locale.Normal, locale)} — ${normalGasPriceDisplay} Gwei — ${normalLegacyGasCostDisplay}`}
          </a>}
        {gasMode === "custom" &&
          <a className="truncate"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {Locale.get(Locale.Custom, locale)}
          </a>}
      </>}
    </ContrastLabel>
    {gasMode === "custom" && maybeIsEip1559 === false && <>
      <div className="h-2" />
      <ContrastLabel>
        <div className="flex-none">
          Gas Limit
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawGasLimitInput}
          onChange={onGasLimitInputChange}
          placeholder={maybeFetchedGasLimit?.toString()} />
      </ContrastLabel>
      <div className="h-2" />
      <ContrastLabel>
        <div className="flex-none">
          Gas Price
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawGasPriceInput}
          onChange={onGasPriceInputChange}
          placeholder={maybeFetchedGasPriceBigInt?.toString()} />
      </ContrastLabel>
    </>}
    {gasMode === "custom" && maybeIsEip1559 === true && <>
      <div className="h-2" />
      <ContrastLabel>
        <div className="flex-none">
          Gas Limit
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawGasLimitInput}
          onChange={onGasLimitInputChange}
          placeholder={maybeFetchedGasLimit?.toString()} />
      </ContrastLabel>
      <div className="h-2" />
      <ContrastLabel>
        <div className="flex-none">
          Max Fee Per Gas
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawMaxFeePerGasInput}
          onChange={onMaxFeePerGasInputChange}
          placeholder={maybeFetchedBaseFeePerGas?.toString()} />
      </ContrastLabel>
      <div className="h-2" />
      <ContrastLabel>
        <div className="flex-none">
          Max Priority Fee Per Gas
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawMaxPriorityFeePerGasInput}
          onChange={onMaxPriorityFeePerGasInputChange}
          placeholder={maybeFetchedMaxPriorityFeePerGasBigInt?.toString()} />
      </ContrastLabel>
    </>}
    {maybeIsEip1559 === false && maybeFinalLegacyGasCost != null && <>
      <div className="h-2" />
      <div className="text-default-contrast">
        {Locale.get({
          en: `This transaction is expected to cost ${finalLegacyGasCostDisplay}`,
          zh: `预计此交易将花费 ${finalLegacyGasCostDisplay}`,
          hi: `इस लेन-देन की लागत ${finalLegacyGasCostDisplay} होने की संभावना है`,
          es: `Se espera que esta transacción cueste ${finalLegacyGasCostDisplay}`,
          ar: `من المتوقع أن تكلف هذه المعاملة ${finalLegacyGasCostDisplay}`,
          fr: `Cette transaction devrait coûter ${finalLegacyGasCostDisplay}`,
          de: `Diese Transaktion wird voraussichtlich ${finalLegacyGasCostDisplay} kosten`,
          ru: `Ожидается, что эта транзакция обойдется в ${finalLegacyGasCostDisplay}`,
          pt: `Esta transação deve custar ${finalLegacyGasCostDisplay}`,
          ja: `このトランザクションの予想コストは ${finalLegacyGasCostDisplay} です`,
          pa: `ਇਹ ਲੇਨ-ਦੇਨ ${finalLegacyGasCostDisplay} ਦਾ ਖਰਚ ਹੋਣ ਦੀ ਉਮੀਦ ਹੈ`,
          bn: `এই লেনদেনটি খরচ করবে ${finalLegacyGasCostDisplay}`,
          id: `Transaksi ini diperkirakan akan menghabiskan ${finalLegacyGasCostDisplay}`,
          ur: `اس لین دین کی قیمت ${finalLegacyGasCostDisplay} ہونے کی توقع ہے`,
          ms: `Transaksi ini dijangka akan menghabiskan ${finalLegacyGasCostDisplay}`,
          it: `Questa transazione dovrebbe costare ${finalLegacyGasCostDisplay}`,
          tr: `Bu işlemin maliyetinin ${finalLegacyGasCostDisplay} olması bekleniyor`,
          ta: `இந்த பரிவர்த்தனையின் செலவு ${finalLegacyGasCostDisplay} ஆகும்`,
          te: `ఈ లేనిదానికి ఖర్చు ${finalLegacyGasCostDisplay} అంశం ఉంది`,
          ko: `이 거래는 ${finalLegacyGasCostDisplay}으로 예상됩니다`,
          vi: `Giao dịch này dự kiến sẽ tốn ${finalLegacyGasCostDisplay}`,
          pl: `Ta transakcja ma kosztować ${finalLegacyGasCostDisplay}`,
          ro: `Se așteaptă ca această tranzacție să coste ${finalLegacyGasCostDisplay}`,
          nl: `Deze transactie wordt naar verwachting ${finalLegacyGasCostDisplay}`,
          el: `Αναμένεται ότι αυτή η συναλλαγή θα κοστίσει ${finalLegacyGasCostDisplay}`,
          th: `คาดว่าธุรกรรมนี้จะต้องใช้ ${finalLegacyGasCostDisplay}`,
          cs: `Tato transakce by měla stát ${finalLegacyGasCostDisplay}`,
          hu: `Ez a tranzakció várhatóan ${finalLegacyGasCostDisplay}`,
          sv: `Denna transaktion förväntas kosta ${finalLegacyGasCostDisplay}`,
          da: `Denne transaktion forventes at koste ${finalLegacyGasCostDisplay}`,
        }, locale)}
      </div>
    </>}
    {maybeIsEip1559 === true && maybeFinalMaxEip1559GasCost != null && maybeFinalMinEip1559GasCost == null && <>
      <div className="h-2" />
      <div className="text-default-contrast">
        {Locale.get({
          en: `This transaction can cost up to ${finalMaxEip1559GasCostDisplay}`,
          zh: `此交易最多可能花费 ${finalMaxEip1559GasCostDisplay}`,
          hi: `इस लेन-देन की लागत अधिकतम ${finalMaxEip1559GasCostDisplay} हो सकती है`,
          es: `Esta transacción puede costar hasta ${finalMaxEip1559GasCostDisplay}`,
          ar: `يمكن أن تكلف هذه المعاملة حتى ${finalMaxEip1559GasCostDisplay}`,
          fr: `Cette transaction peut coûter jusqu'à ${finalMaxEip1559GasCostDisplay}`,
          de: `Diese Transaktion kann bis zu ${finalMaxEip1559GasCostDisplay} kosten`,
          ru: `Эта транзакция может обойтись в ${finalMaxEip1559GasCostDisplay}`,
          pt: `Esta transação pode custar até ${finalMaxEip1559GasCostDisplay}`,
          ja: `このトランザクションの最大コストは ${finalMaxEip1559GasCostDisplay} です`,
          pa: `ਇਹ ਲੇਨ-ਦੇਨ ${finalMaxEip1559GasCostDisplay} ਤੱਕ ਦਾ ਖਰਚ ਹੋ ਸਕਦਾ ਹੈ`,
          bn: `এই লেনদেনটি সর্বাধিক ${finalMaxEip1559GasCostDisplay} খরচ করতে পারে`,
          id: `Transaksi ini dapat menghabiskan hingga ${finalMaxEip1559GasCostDisplay}`,
          ur: `اس لین دین کی قیمت ${finalMaxEip1559GasCostDisplay} تک ہو سکتی ہے`,
          ms: `Transaksi ini boleh menghabiskan sehingga ${finalMaxEip1559GasCostDisplay}`,
          it: `Questa transazione può costare fino a ${finalMaxEip1559GasCostDisplay}`,
          tr: `Bu işlem ${finalMaxEip1559GasCostDisplay} 'e kadar mal olabilir`,
          ta: `இந்த பரிவர்த்தனையின் அதிகபட்ச செலவு ${finalMaxEip1559GasCostDisplay}`,
          te: `ఈ లేనిదానికి అధికంగా ${finalMaxEip1559GasCostDisplay} ఖర్చు అవచ్చు`,
          ko: `이 거래는 최대 ${finalMaxEip1559GasCostDisplay}으로 비용이 발생할 수 있습니다`,
          vi: `Giao dịch này có thể tốn tới ${finalMaxEip1559GasCostDisplay}`,
          pl: `Ta transakcja może kosztować do ${finalMaxEip1559GasCostDisplay}`,
          ro: `Această tranzacție poate costa până la ${finalMaxEip1559GasCostDisplay}`,
          nl: `Deze transactie kan maximaal ${finalMaxEip1559GasCostDisplay} kosten`,
          el: `Αυτή η συναλλαγή μπορεί να κοστίσει μέχρι ${finalMaxEip1559GasCostDisplay}`,
          th: `ธุรกรรมนี้สามารถใช้ได้สูงสุด ${finalMaxEip1559GasCostDisplay}`,
          cs: `Tato transakce může stát až ${finalMaxEip1559GasCostDisplay}`,
          hu: `Ez a tranzakció legfeljebb ${finalMaxEip1559GasCostDisplay}`,
          sv: `Denna transaktion kan kosta upp till ${finalMaxEip1559GasCostDisplay}`,
          da: `Denne transaktion kan koste op til ${finalMaxEip1559GasCostDisplay}`,
        }, locale)}
      </div>
    </>}
    {maybeIsEip1559 === true && maybeFinalMaxEip1559GasCost != null && maybeFinalMinEip1559GasCost != null && <>
      <div className="h-2" />
      <div className="text-default-contrast">
        {Locale.get({
          en: `This transaction is expected to cost ${finalMinEip1559GasCostDisplay} but can cost up to ${finalMaxEip1559GasCostDisplay}`,
          zh: `预计此交易将花费 ${finalMinEip1559GasCostDisplay} 但最多可能花费 ${finalMaxEip1559GasCostDisplay}`,
          hi: `इस लेन-देन की लागत ${finalMinEip1559GasCostDisplay} होने की संभावना है लेकिन अधिकतम ${finalMaxEip1559GasCostDisplay} हो सकती है`,
          es: `Se espera que esta transacción cueste ${finalMinEip1559GasCostDisplay} pero puede costar hasta ${finalMaxEip1559GasCostDisplay}`,
          ar: `من المتوقع أن تكلف هذه المعاملة ${finalMinEip1559GasCostDisplay} ولكن يمكن أن تكلف حتى ${finalMaxEip1559GasCostDisplay}`,
          fr: `Cette transaction devrait coûter ${finalMinEip1559GasCostDisplay} mais peut coûter jusqu'à ${finalMaxEip1559GasCostDisplay}`,
          de: `Diese Transaktion wird voraussichtlich ${finalMinEip1559GasCostDisplay} kosten, kann aber bis zu ${finalMaxEip1559GasCostDisplay} kosten`,
          ru: `Ожидается, что эта транзакция обойдется в ${finalMinEip1559GasCostDisplay}, но может обойтись в ${finalMaxEip1559GasCostDisplay}`,
          pt: `Esta transação deve custar ${finalMinEip1559GasCostDisplay} mas pode custar até ${finalMaxEip1559GasCostDisplay}`,
          ja: `このトランザクションの予想コストは ${finalMinEip1559GasCostDisplay} ですが、最大で ${finalMaxEip1559GasCostDisplay} かかることがあります`,
          pa: `ਇਹ ਲੇਨ-ਦੇਨ ${finalMinEip1559GasCostDisplay} ਦਾ ਖਰਚ ਕਰ ਸਕਦਾ ਹੈ ਪਰ ਅਧਿਕਤਮ ${finalMaxEip1559GasCostDisplay} ਤੱਕ ਖਰਚ ਹੋ ਸਕਦਾ ਹੈ`,
          bn: `এই লেনদেনটি খরচ করতে পারে ${finalMinEip1559GasCostDisplay} তবে সর্বাধিক ${finalMaxEip1559GasCostDisplay}`,
          id: `Transaksi ini diperkirakan akan menghabiskan ${finalMinEip1559GasCostDisplay} tetapi bisa menghabiskan hingga ${finalMaxEip1559GasCostDisplay}`,
          ur: `اس لین دین کی قیمت ${finalMinEip1559GasCostDisplay} ہونے کی توقع ہے لیکن یہ ${finalMaxEip1559GasCostDisplay} تک ہو سکتی ہے`,
          ms: `Transaksi ini dijangka akan menghabiskan ${finalMinEip1559GasCostDisplay} tetapi boleh menghabiskan sehingga ${finalMaxEip1559GasCostDisplay}`,
          it: `Questa transazione dovrebbe costare ${finalMinEip1559GasCostDisplay} ma può costare fino a ${finalMaxEip1559GasCostDisplay}`,
          tr: `Bu işlem ${finalMinEip1559GasCostDisplay} 'e mal olacak ama ${finalMaxEip1559GasCostDisplay} 'e kadar mal olabilir`,
          ta: `இந்த பரிவர்த்தனையின் செலவு ${finalMinEip1559GasCostDisplay} ஆகும், ஆனால் அதிகபட்சம் ${finalMaxEip1559GasCostDisplay} ஆகும்`,
          te: `ఈ లేనిదానికి ఖర్చు ${finalMinEip1559GasCostDisplay} అంశం ఉంది కానీ అధికంగా ${finalMaxEip1559GasCostDisplay} అంశం ఉంది`,
          ko: `이 거래는 ${finalMinEip1559GasCostDisplay}으로 예상됩니다만 최대 ${finalMaxEip1559GasCostDisplay}으로 비용이 발생할 수 있습니다`,
          vi: `Giao dịch này dự kiến sẽ tốn ${finalMinEip1559GasCostDisplay} nhưng có thể tốn tới ${finalMaxEip1559GasCostDisplay}`,
          pl: `Ta transakcja ma kosztować ${finalMinEip1559GasCostDisplay} ale może kosztować do ${finalMaxEip1559GasCostDisplay}`,
          ro: `Această tranzacție se așteaptă să coste ${finalMinEip1559GasCostDisplay} dar poate costa până la ${finalMaxEip1559GasCostDisplay}`,
          nl: `Deze transactie wordt naar verwachting ${finalMinEip1559GasCostDisplay} maar kan maximaal ${finalMaxEip1559GasCostDisplay} kosten`,
          el: `Αναμένεται αυτή η συναλλαγή να κοστίζει ${finalMinEip1559GasCostDisplay} αλλά μπορεί να κοστίσει μέχρι ${finalMaxEip1559GasCostDisplay}`,
          th: `ธุรกรรมนี้คาดว่าจะใช้ ${finalMinEip1559GasCostDisplay} แต่สามารถใช้ได้สูงสุด ${finalMaxEip1559GasCostDisplay}`,
          cs: `Tato transakce by měla stát ${finalMinEip1559GasCostDisplay} ale může stát až ${finalMaxEip1559GasCostDisplay}`,
          hu: `Ez a tranzakció várhatóan ${finalMinEip1559GasCostDisplay} de legfeljebb ${finalMaxEip1559GasCostDisplay}`,
          sv: `Denna transaktion förväntas kosta ${finalMinEip1559GasCostDisplay} men kan kosta upp till ${finalMaxEip1559GasCostDisplay}`,
          da: `Denne transaktion forventes at koste ${finalMinEip1559GasCostDisplay}, men kan koste op til ${finalMaxEip1559GasCostDisplay}`
        }, locale)}
      </div>
    </>}
    <div className="h-4 grow" />
    {maybeTriedEip1559GasLimitKey?.isErr() && <>
      <div className="po-2 flex items-center bg-default-contrast rounded-xl text-red-400 dark:text-red-500">
        {maybeTriedEip1559GasLimitKey.getErr()?.message}
      </div>
      <div className="h-2" />
    </>}
    {maybeTriedLegacyGasLimitKey?.isErr() && <>
      <div className="po-2 flex items-center bg-default-contrast rounded-xl text-red-400 dark:text-red-500">
        {maybeTriedLegacyGasLimitKey.getErr()?.message}
      </div>
      <div className="h-2" />
    </>}
    {eip1559GasLimitQuery.current?.isErr() && <>
      <div className="po-2 flex items-center bg-default-contrast rounded-xl text-red-400 dark:text-red-500">
        {eip1559GasLimitQuery.current.getErr()?.message}
      </div>
      <div className="h-2" />
    </>}
    {legacyGasLimitQuery.current?.isErr() && <>
      <div className="po-2 flex items-center bg-default-contrast rounded-xl text-red-400 dark:text-red-500">
        {legacyGasLimitQuery.current.getErr()?.message}
      </div>
      <div className="h-2" />
    </>}
    <div className="flex items-center flex-wrap-reverse gap-2">
      {!disableSign &&
        <WideClickableContrastButton
          disabled={onSignClick.loading}
          onClick={onSignClick.run}>
          <Outline.PencilIcon className="size-5" />
          {Locale.get(Locale.Sign, locale)}
        </WideClickableContrastButton>}
      <WideClickableOppositeButton
        disabled={onSendClick.loading}
        onClick={onSendClick.run}>
        <Outline.PaperAirplaneIcon className="size-5" />
        {Locale.get(Locale.Send, locale)}
      </WideClickableOppositeButton>
    </div>
  </>
}

export function ExecutedTransactionCard(props: { data: ExecutedTransactionData }) {
  const { data } = props

  const onCopy = useCopy(data.hash)

  const chainData = chainDataByChainId[data.chainId]

  return <div className="po-2 flex items-center bg-default-contrast rounded-xl">
    <div className="flex flex-col truncate">
      <div className="flex items-center">
        <Outline.CheckIcon className="size-4 flex-none" />
        <div className="w-2" />
        <div className="font-medium">
          Transaction confirmed
        </div>
      </div>
      <div className="text-default-contrast truncate">
        {data.hash}
      </div>
      <div className="h-2" />
      <div className="flex items-center gap-1">
        <button className="group px-2 bg-default-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onCopy.run}>
          <GapperAndClickerInAnchorDiv>
            Copy
            {onCopy.current
              ? <Outline.CheckIcon className="size-4" />
              : <Outline.ClipboardIcon className="size-4" />}
          </GapperAndClickerInAnchorDiv>
        </button>
        <a className="group px-2 bg-default-contrast rounded-full"
          target="_blank" rel="noreferrer"
          href={`${chainData.etherscan}/tx/${data.hash}`}>
          <GapperAndClickerInAnchorDiv>
            Open
            <Outline.ArrowTopRightOnSquareIcon className="size-4" />
          </GapperAndClickerInAnchorDiv>
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
  const locale = useLocaleContext().getOrThrow()
  const { data, onRetry } = props

  const onCopy = useCopy(data.hash)

  const onRetryClick = useCallback(() => {
    onRetry(data)
  }, [data, onRetry])

  const chainData = chainDataByChainId[data.chainId]

  return <div className="po-2 flex items-center bg-default-contrast rounded-xl">
    <div className="flex flex-col truncate">
      <div className="flex items-center">
        <SmallUnflexLoading />
        <div className="w-2" />
        <div className="font-medium">
          {Locale.get({
            en: "Transaction sent",
            zh: "交易已发送",
            hi: "लेन-देन भेजा गया",
            es: "Transacción enviada",
            ar: "تم إرسال المعاملة",
            fr: "Transaction envoyée",
            de: "Transaktion gesendet",
            ru: "Транзакция отправлен",
            pt: "Transação enviada",
            ja: "トランザクションが送信されました",
            pa: "ਲੇਨ-ਦੇਨ ਭੇਜਿਆ ਗਿਆ",
            bn: "লেনদেন প্রেরিত",
            id: "Transaksi dikirim",
            ur: "لین دین بھیجا گیا",
            ms: "Transaksi dihantar",
            it: "Transazione inviata",
            tr: "İşlem gönderildi",
            ta: "பரிவர்த்தனை அனுப்பப்பட்டது",
            te: "లేనిదానికి పంపబడింది",
            ko: "거래가 전송되었습니다",
            vi: "Giao dịch đã được gửi",
            pl: "Transakcja wysłana",
            ro: "Tranzacția a fost trimisă",
            nl: "Transactie verzonden",
            el: "Η συναλλαγή στάλθηκε",
            th: "ธุรกรรมถูกส่ง",
            cs: "Transakce odeslána",
            hu: "Tranzakció elküldve",
            sv: "Transaktionen skickad",
            da: "Transaktion sendt",
          }, locale)}
        </div>
      </div>
      <div className="text-default-contrast truncate">
        {data.hash}
      </div>
      <div className="h-2" />
      <div className="flex items-center gap-1">
        <button className="group px-2 bg-default-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onCopy.run}>
          <GapperAndClickerInAnchorDiv>
            {Locale.get(Locale.Copy, locale)}
            {onCopy.current
              ? <Outline.CheckIcon className="size-4" />
              : <Outline.ClipboardIcon className="size-4" />}
          </GapperAndClickerInAnchorDiv>
        </button>
        <a className="group px-2 bg-default-contrast rounded-full"
          target="_blank" rel="noreferrer"
          href={`${chainData.etherscan}/tx/${data.hash}`}>
          <GapperAndClickerInAnchorDiv>
            {Locale.get(Locale.Open, locale)}
            <Outline.ArrowTopRightOnSquareIcon className="size-4" />
          </GapperAndClickerInAnchorDiv>
        </a>
        {/* <button className="group px-2 bg-default-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onRetryClick}>
          <GapperAndClickerInAnchorDiv>
            Retry
            <Outline.BoltIcon className="size-4" />
          </GapperAndClickerInAnchorDiv>
        </button> */}
      </div>
    </div>
  </div>
}

export function SignedTransactionCard(props: { data: SignedTransactionData } & { onSend: (data: TransactionData) => void }) {
  const locale = useLocaleContext().getOrThrow()
  const { data, onSend } = props

  const onCopy = useCopy(data.data)

  const onSendClick = useCallback(() => {
    onSend(data)
  }, [data, onSend])

  return <div className="po-2 flex items-center bg-default-contrast rounded-xl">
    <div className="flex flex-col truncate">
      <div className="flex items-center">
        <div className="font-medium">
          {Locale.get({
            en: "Transaction signed",
            zh: "交易已签名",
            hi: "लेन-देन हस्ताक्षरित",
            es: "Transacción firmada",
            ar: "تم توقيع المعاملة",
            fr: "Transaction signée",
            de: "Transaktion signiert",
            ru: "Транзакция подписана",
            pt: "Transação assinada",
            ja: "トランザクションが署名されました",
            pa: "ਲੇਨ-ਦੇਨ ਦਾ ਹਸਤਾਕਾਰ ਕੀਤਾ ਗਿਆ",
            bn: "লেনদেন স্বাক্ষরিত",
            id: "Transaksi ditandatangani",
            ur: "لین دین کا دستخط کیا گیا",
            ms: "Transaksi ditandatangani",
            it: "Transazione firmata",
            tr: "İşlem imzalandı",
            ta: "பரிவர்த்தனை கையொப்பம் செய்யப்பட்டது",
            te: "లేనిదానికి సంతకం చేయబడింది",
            ko: "거래가 서명되었습니다",
            vi: "Giao dịch đã được ký",
            pl: "Transakcja podpisana",
            ro: "Tranzacția semnată",
            nl: "Transactie ondertekend",
            el: "Η συναλλαγή υπογράφηκε",
            th: "ธุรกรรมถูกลงลายมือ",
            cs: "Transakce byla podepsána",
            hu: "A tranzakció aláírva",
            sv: "Transaktionen signerad",
            da: "Transaktion underskrevet",
          }, locale)}
        </div>
      </div>
      <div className="text-default-contrast truncate">
        {data.data}
      </div>
      <div className="h-2" />
      <div className="flex items-center gap-1">
        <button className="group px-2 bg-default-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onCopy.run}>
          <GapperAndClickerInAnchorDiv>
            {Locale.get(Locale.Copy, locale)}
            {onCopy.current
              ? <Outline.CheckIcon className="size-4" />
              : <Outline.ClipboardIcon className="size-4" />}
          </GapperAndClickerInAnchorDiv>
        </button>
        {/* <button className="group px-2 bg-default-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onSendClick}>
          <GapperAndClickerInAnchorDiv>
            {Locale.get(Locale.Send, locale)}
            <Outline.PaperAirplaneIcon className="size-4" />
          </GapperAndClickerInAnchorDiv>
        </button> */}
      </div>
    </div>
  </div>
}