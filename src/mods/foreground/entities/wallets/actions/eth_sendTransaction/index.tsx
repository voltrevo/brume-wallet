import { BigIntToHex } from "@/libs/bigints/bigints";
import { useCopy } from "@/libs/copy/copy";
import { Errors, UIError } from "@/libs/errors/errors";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { nto } from "@/libs/ntu";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useEffectButNotFirstTime } from "@/libs/react/effect";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog } from "@/libs/ui/dialog";
import { SmallUnshrinkableLoading } from "@/libs/ui/loading";
import { Menu } from "@/libs/ui/menu";
import { SelectAndClose } from "@/libs/ui/select";
import { AnchorShrinkerDiv } from "@/libs/ui/shrinker";
import { urlOf } from "@/libs/url/url";
import { randomUUID } from "@/libs/uuid/uuid";
import { ExecutedTransactionData, PendingTransactionData, SignedTransactionData, TransactionData, TransactionParametersData, TransactionTrialRef } from "@/mods/background/service_worker/entities/transactions/data";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext, useSearchState } from "@hazae41/chemin";
import { Address, Fixed, ZeroHexAsInteger, ZeroHexString } from "@hazae41/cubane";
import { Data } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable, Option, Some } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { Ok, Result } from "@hazae41/result";
import { Transaction, ethers } from "ethers";
import { SyntheticEvent, useCallback, useDeferredValue, useMemo, useState } from "react";
import { useBlockByNumber } from "../../../blocks/data";
import { useEnsLookup } from "../../../names/data";
import { useTransactionWithReceipt } from "../../../transactions/data";
import { useEstimateGas, useGasPrice, useMaxPriorityFeePerGas, useNonce } from "../../../unknown/data";
import { useWalletDataContext } from "../../context";
import { EthereumWalletInstance, useEthereumContext, useEthereumContext2 } from "../../data";
import { PriceResolver } from "../../page";
import { ShrinkableContrastButtonInInputBox, SimpleInput, SimpleLabel, SimpleTextarea, WideShrinkableContrastButton, WideShrinkableNakedMenuButton, WideShrinkableOppositeButton } from "../send";
import { WalletDecodeDialog } from "./decode";
import { WalletNonceDialog } from "./nonce";

export function WalletTransactionDialog(props: {}) {
  const path = usePathContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()

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

  const gasMode = Option.wrap(maybeGasMode).unwrapOr("normal")

  const trialUuidFallback = useConstant(() => randomUUID())
  const trialUuid = Option.wrap(maybeTrial).unwrapOr(trialUuidFallback)

  const disableData = Boolean(maybeDisableData)
  const disableSign = Boolean(maybeDisableSign)

  const chain = Option.unwrap(maybeChain)
  const chainData = chainDataByChainId[Number(chain)]
  const tokenData = chainData.token

  const context = useEthereumContext2(wallet.uuid, chainData).unwrap()

  const transactionUuid = useConstant(() => randomUUID())
  const transactionQuery = useTransactionWithReceipt(transactionUuid, context)

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

  const mainnet = useEthereumContext(wallet.uuid, chainDataByChainId[1])

  const maybeEnsQueryKey = maybeTarget?.endsWith(".eth")
    ? maybeTarget
    : undefined

  const ensTargetQuery = useEnsLookup(maybeEnsQueryKey, mainnet)
  const maybeEnsTarget = ensTargetQuery.current?.ok().get()

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
      return Fixed.fromString(rawValue, tokenData.decimals)
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
    if (maybePendingNonce != null)
      return maybePendingNonce
    return undefined
  }, [maybeCustomNonce, maybePendingNonce])

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
  const maybeFinalMinEip1559GasCost = useMode(maybeNormalMinEip1559GasCost, maybeFastMinEip1559GasCost, maybeUrgentMinEip1559GasCost, undefined)
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

  const signOrSendOrAlert = useCallback((action: "sign" | "send") => Errors.runAndLogAndAlert(async () => {
    if (maybeIsEip1559 == null)
      return

    const maybeTarget = Option.wrap(maybeFinalTarget).mapSync(Address.fromOrThrow).get()

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
      }).unwrap()

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

    const instance = await EthereumWalletInstance.tryFrom(wallet, context.background).then(r => r.unwrap())
    const signature = await instance.trySignTransaction(tx, context.background).then(r => r.unwrap())

    tx.signature = signature

    if (action === "sign") {
      const { chainId } = chainData

      const uuid = transactionUuid
      const hash = tx.hash as ZeroHexString
      const data = tx.serialized as ZeroHexString
      const trial = TransactionTrialRef.create(trialUuid)

      await transactionQuery.mutate(() => new Some(new Data({ type: "signed", uuid, trial, chainId, hash, data, params } as const)))

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
      }).then(r => r.unwrap())

      await transactionQuery.mutate(() => new Some(new Data({ type: "pending", uuid, trial, chainId, hash, data, params } as const)))

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
      <div className="shrink-0">
        Target
      </div>
      <div className="w-4" />
      <SimpleInput
        value={nto(maybeTarget)}
        readOnly />
    </SimpleLabel>
    <div className="h-2" />
    <SimpleLabel>
      <div className="shrink-0">
        Value
      </div>
      <div className="w-4" />
      <div className="grow flex flex-col overflow-hidden">
        <div className="flex items-center">
          <SimpleInput
            readOnly
            value={rawValuedInput}
            placeholder="0.0" />
          <div className="w-1" />
          <div className="text-contrast">
            {tokenData.symbol}
          </div>
        </div>
        <div className="flex items-center cursor-pointer">
          <div className="text-contrast truncate">
            {rawPricedInput || "0.0"}
          </div>
          <div className="grow" />
          <div className="text-contrast">
            USD
          </div>
        </div>
      </div>
    </SimpleLabel>
    <div className="h-4" />
    <div className="font-medium">
      Advanced
    </div>
    <div className="h-2" />
    <SimpleLabel>
      <div className="shrink-0">
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
    </SimpleLabel>
    <div className="h-2" />
    <div className="po-md flex flex-col bg-contrast rounded-xl">
      <div className="flex items-start">
        <div className="shrink-0">
          Data
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
      <WideShrinkableContrastButton
        disabled={maybeData == null}
        onClick={onDecodeClick}>
        <Outline.MagnifyingGlassIcon className="size-4" />
        Decode
      </WideShrinkableContrastButton>
    </div>
    <div className="h-4" />
    <div className="font-medium">
      Gas
    </div>
    <div className="h-2" />
    <SimpleLabel>
      <div className="shrink-0">
        Gas
      </div>
      <div className="w-4" />
      {maybeIsEip1559 === true && <>
        <HashSubpathProvider>
          {hash.url.pathname === "/gas" &&
            <Menu>
              <SelectAndClose ok={setGasMode}>
                <div className="flex flex-col text-left gap-2">
                  <WideShrinkableNakedMenuButton
                    data-value="urgent">
                    {`Urgent — ${urgentBaseFeePerGasDisplay}:${urgentMaxPriorityFeePerGasDisplay} Gwei — ${urgentMinEip1559GasCostDisplay}-${urgentMaxEip1559GasCostDisplay}`}
                  </WideShrinkableNakedMenuButton>
                  <WideShrinkableNakedMenuButton
                    data-value="fast">
                    {`Fast — ${fastBaseFeePerGasDisplay}:${fastMaxPriorityFeePerGasDisplay} Gwei — ${fastMinEip1559GasCostDisplay}-${fastMaxEip1559GasCostDisplay}`}
                  </WideShrinkableNakedMenuButton>
                  <WideShrinkableNakedMenuButton
                    data-value="normal">
                    {`Normal — ${normalBaseFeePerGasDisplay}:${normalMaxPriorityFeePerGasDisplay} Gwei — ${normalMinEip1559GasCostDisplay}-${normalMaxEip1559GasCostDisplay}`}
                  </WideShrinkableNakedMenuButton>
                  <WideShrinkableNakedMenuButton
                    data-value="custom">
                    {`Custom`}
                  </WideShrinkableNakedMenuButton>
                </div>
              </SelectAndClose>
            </Menu>}
        </HashSubpathProvider>
        {gasMode === "urgent" &&
          <a className="overflow-ellipsis overflow-x-hidden"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`Urgent — ${urgentBaseFeePerGasDisplay}:${urgentMaxPriorityFeePerGasDisplay} Gwei — ${urgentMinEip1559GasCostDisplay}-${urgentMaxEip1559GasCostDisplay}`}
          </a>}
        {gasMode === "fast" &&
          <a className="overflow-ellipsis overflow-x-hidden"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`Fast — ${fastBaseFeePerGasDisplay}:${fastMaxPriorityFeePerGasDisplay} Gwei — ${fastMinEip1559GasCostDisplay}-${fastMaxEip1559GasCostDisplay}`}
          </a>}
        {gasMode === "normal" &&
          <a className="overflow-ellipsis overflow-x-hidden"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`Normal — ${normalBaseFeePerGasDisplay}:${normalMaxPriorityFeePerGasDisplay} Gwei — ${normalMinEip1559GasCostDisplay}-${normalMaxEip1559GasCostDisplay}`}
          </a>}
        {gasMode === "custom" &&
          <a className="overflow-ellipsis overflow-x-hidden"
            onClick={gasGenius.onClick}
            onKeyDown={gasGenius.onKeyDown}
            href={gasGenius.href}>
            {`Custom`}
          </a>}
      </>}
      {maybeIsEip1559 === false &&
        <select className="w-full bg-transparent outline-none overflow-ellipsis overflow-x-hidden appearance-none"
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
    </SimpleLabel>
    {gasMode === "custom" && maybeIsEip1559 === false && <>
      <div className="h-2" />
      <SimpleLabel>
        <div className="shrink-0">
          Gas Limit
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawGasLimitInput}
          onChange={onGasLimitInputChange}
          placeholder={maybeFetchedGasLimit?.toString()} />
      </SimpleLabel>
      <div className="h-2" />
      <SimpleLabel>
        <div className="shrink-0">
          Gas Price
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawGasPriceInput}
          onChange={onGasPriceInputChange}
          placeholder={maybeFetchedGasPrice?.toString()} />
      </SimpleLabel>
    </>}
    {gasMode === "custom" && maybeIsEip1559 === true && <>
      <div className="h-2" />
      <SimpleLabel>
        <div className="shrink-0">
          Gas Limit
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawGasLimitInput}
          onChange={onGasLimitInputChange}
          placeholder={maybeFetchedGasLimit?.toString()} />
      </SimpleLabel>
      <div className="h-2" />
      <SimpleLabel>
        <div className="shrink-0">
          Max Fee Per Gas
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawMaxFeePerGasInput}
          onChange={onMaxFeePerGasInputChange}
          placeholder={maybeFetchedBaseFeePerGas?.toString()} />
      </SimpleLabel>
      <div className="h-2" />
      <SimpleLabel>
        <div className="shrink-0">
          Max Priority Fee Per Gas
        </div>
        <div className="w-4" />
        <SimpleInput
          value={rawMaxPriorityFeePerGasInput}
          onChange={onMaxPriorityFeePerGasInputChange}
          placeholder={maybeFetchedMaxPriorityFeePerGas?.toString()} />
      </SimpleLabel>
    </>}
    {maybeIsEip1559 === false && maybeFinalLegacyGasCost != null && <>
      <div className="h-2" />
      <div className="text-contrast">
        This transaction is expected to cost {finalLegacyGasCostDisplay}
      </div>
    </>}
    {maybeIsEip1559 === true && maybeFinalMaxEip1559GasCost != null && maybeFinalMinEip1559GasCost == null && <>
      <div className="h-2" />
      <div className="text-contrast">
        This transaction can cost up to {finalMaxEip1559GasCostDisplay}
      </div>
    </>}
    {maybeIsEip1559 === true && maybeFinalMaxEip1559GasCost != null && maybeFinalMinEip1559GasCost != null && <>
      <div className="h-2" />
      <div className="text-contrast">
        This transaction is expected to cost {finalMinEip1559GasCostDisplay} but can cost up to {finalMaxEip1559GasCostDisplay}
      </div>
    </>}
    <div className="h-4 grow" />
    {maybeTriedEip1559GasLimitKey?.isErr() && <>
      <div className="po-md flex items-center bg-contrast rounded-xl text-red-400 dark:text-red-500">
        {maybeTriedEip1559GasLimitKey.getErr()?.message}
      </div>
      <div className="h-2" />
    </>}
    {maybeTriedLegacyGasLimitKey?.isErr() && <>
      <div className="po-md flex items-center bg-contrast rounded-xl text-red-400 dark:text-red-500">
        {maybeTriedLegacyGasLimitKey.getErr()?.message}
      </div>
      <div className="h-2" />
    </>}
    {eip1559GasLimitQuery.current?.isErr() && <>
      <div className="po-md flex items-center bg-contrast rounded-xl text-red-400 dark:text-red-500">
        {eip1559GasLimitQuery.current.getErr()?.message}
      </div>
      <div className="h-2" />
    </>}
    {legacyGasLimitQuery.current?.isErr() && <>
      <div className="po-md flex items-center bg-contrast rounded-xl text-red-400 dark:text-red-500">
        {legacyGasLimitQuery.current.getErr()?.message}
      </div>
      <div className="h-2" />
    </>}
    <div className="flex items-center flex-wrap-reverse gap-2">
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
  </>
}

export function ExecutedTransactionCard(props: { data: ExecutedTransactionData }) {
  const { data } = props

  const onCopy = useCopy(data.hash)

  const chainData = chainDataByChainId[data.chainId]

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
          <AnchorShrinkerDiv>
            Copy
            {onCopy.current
              ? <Outline.CheckIcon className="size-4" />
              : <Outline.ClipboardIcon className="size-4" />}
          </AnchorShrinkerDiv>
        </button>
        <a className="group px-2 bg-contrast rounded-full"
          target="_blank" rel="noreferrer"
          href={`${chainData.etherscan}/tx/${data.hash}`}>
          <AnchorShrinkerDiv>
            Open
            <Outline.ArrowTopRightOnSquareIcon className="size-4" />
          </AnchorShrinkerDiv>
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

  const chainData = chainDataByChainId[data.chainId]

  return <div className="po-md flex items-center bg-contrast rounded-xl">
    <div className="flex flex-col truncate">
      <div className="flex items-center">
        <SmallUnshrinkableLoading />
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
          <AnchorShrinkerDiv>
            Copy
            {onCopy.current
              ? <Outline.CheckIcon className="size-4" />
              : <Outline.ClipboardIcon className="size-4" />}
          </AnchorShrinkerDiv>
        </button>
        <a className="group px-2 bg-contrast rounded-full"
          target="_blank" rel="noreferrer"
          href={`${chainData.etherscan}/tx/${data.hash}`}>
          <AnchorShrinkerDiv>
            Open
            <Outline.ArrowTopRightOnSquareIcon className="size-4" />
          </AnchorShrinkerDiv>
        </a>
        <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onRetryClick}>
          <AnchorShrinkerDiv>
            Retry
            <Outline.BoltIcon className="size-4" />
          </AnchorShrinkerDiv>
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
          <AnchorShrinkerDiv>
            Copy
            {onCopy.current
              ? <Outline.CheckIcon className="size-4" />
              : <Outline.ClipboardIcon className="size-4" />}
          </AnchorShrinkerDiv>
        </button>
        <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
          onClick={onSendClick}>
          <AnchorShrinkerDiv>
            Send
            <Outline.PaperAirplaneIcon className="size-4" />
          </AnchorShrinkerDiv>
        </button>
      </div>
    </div>
  </div>
}