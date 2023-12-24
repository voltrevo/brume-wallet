/* eslint-disable @next/next/no-img-element */
import { BigIntToHex } from "@/libs/bigints/bigints";
import { useCopy } from "@/libs/copy/copy";
import { Errors, UIError } from "@/libs/errors/errors";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useKeyboardEnter } from "@/libs/react/events";
import { ChildrenProps } from "@/libs/react/props/children";
import { ButtonProps, InputProps, TextareaProps } from "@/libs/react/props/html";
import { Setter } from "@/libs/react/state";
import { Dialog, useDialogContext } from "@/libs/ui/dialog/dialog";
import { Loading } from "@/libs/ui/loading/loading";
import { NativeTokenData } from "@/mods/background/service_worker/entities/tokens/data";
import { Address, Fixed, ZeroHexString } from "@hazae41/cubane";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable, Option, Optional } from "@hazae41/option";
import { Transaction, ethers } from "ethers";
import { SyntheticEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useWalletDataContext } from "../../context";
import { EthereumWalletInstance, FgEthereumContext, useBalance, useBlockByNumber, useEnsLookup, useEstimateGas, useEthereumContext, useGasPrice, useMaxPriorityFeePerGas, useNonce, usePricedBalance } from "../../data";
import { PriceResolver } from "../../page";

type Step =
  | TargetStep
  | ValueStep
  | NonceStep

type TargetStep = {
  readonly step: "target"
  readonly target?: string
  readonly valued?: string
  readonly priced?: string
  readonly nonce?: string
  readonly data?: ZeroHexString
}

type ValueStep = {
  readonly step: "value",
  readonly target: string
  readonly valued?: string
  readonly priced?: string
  readonly nonce?: string
  readonly data?: ZeroHexString
}

type NonceStep = {
  readonly step: "nonce",
  readonly target: string
  readonly valued?: string
  readonly priced?: string
  readonly nonce?: string
  readonly data?: ZeroHexString
}

export function WalletSendScreen(props: {
  readonly context: FgEthereumContext
  readonly token: NativeTokenData
}) {
  const { context, token } = props

  const [step, setStep] = useState<Step>({ step: "target" })

  if (step.step === "target")
    return <WalletSendScreenTarget
      step={step}
      setStep={setStep} />
  if (step.step === "value")
    return <WalletSendScreenValue
      tokenData={token}
      context={context}
      step={step}
      setStep={setStep} />
  if (step.step === "nonce")
    return <WalletSendScreenNonce
      context={context}
      step={step}
      setStep={setStep} />
  return null
}

export function WalletSendScreenTarget(props: {
  readonly step: TargetStep
  readonly setStep: Setter<Step>
}) {
  const { step, setStep } = props
  const wallet = useWalletDataContext().unwrap()
  const { close } = useDialogContext().unwrap()

  const mainnet = useEthereumContext(wallet.uuid, chainByChainId[1])

  const [rawInput = "", setRawInput] = useState<Optional<string>>(step.target)

  const onInputChange = useInputChange(e => {
    setRawInput(e.target.value)
  }, [])

  const input = useDeferredValue(rawInput)

  const maybeEnsInput = input.endsWith(".eth")
    ? input
    : undefined

  const ensQuery = useEnsLookup(maybeEnsInput, mainnet)
  const maybeEns = ensQuery.data?.get()

  const onSubmit = useCallback(async () => {
    if (!Address.is(input) && !input.endsWith(".eth"))
      return
    setStep({ ...step, step: "value", target: input })
  }, [step, setStep, input])

  const onEnter = useKeyboardEnter(() => {
    onSubmit()
  }, [onSubmit])

  const onClear = useCallback((e: SyntheticEvent) => {
    setRawInput("")
  }, [])

  const onPaste = useCallback(async () => {
    const input = await navigator.clipboard.readText()

    setRawInput(input)

    if (!Address.is(input) && !input.endsWith(".eth"))
      return
    setStep({ ...step, step: "value", target: input })
  }, [step, setStep])

  const [mode, setMode] = useState<"recents" | "contacts">("recents")

  const onRecentsClick = useCallback(() => {
    setMode("recents")
  }, [])

  const onContactsClick = useCallback(() => {
    setMode("contacts")
  }, [])

  const onBrumeClick = useCallback(() => {
    setRawInput("brume.eth")
    setStep({ ...step, step: "value", target: "brume.eth" })
  }, [step, setStep])

  return <>
    <Dialog.Title close={close}>
      Send
    </Dialog.Title>
    <div className="h-4" />
    <SimpleBox>
      <div className="">
        Target
      </div>
      <div className="w-4" />
      <SimpleInput key="target"
        autoFocus
        value={rawInput}
        onChange={onInputChange}
        onKeyDown={onEnter}
        placeholder="brume.eth" />
      <div className="w-1" />
      <div className="flex items-center">
        {rawInput.length === 0
          ? <ShrinkableNakedButtonInInputBox
            onClick={onPaste}>
            <Outline.ClipboardIcon className="size-4" />
          </ShrinkableNakedButtonInInputBox>
          : <ShrinkableNakedButtonInInputBox
            onClick={onClear}>
            <Outline.XMarkIcon className="size-4" />
          </ShrinkableNakedButtonInInputBox>}
        <div className="w-1" />
        <ShrinkableContrastButtonInInputBox
          disabled={!Address.is(input) && !input.endsWith(".eth")}
          onClick={onSubmit}>
          OK
        </ShrinkableContrastButtonInInputBox>
      </div>
    </SimpleBox>
    {maybeEns != null && <>
      <div className="h-2" />
      <div className="po-md flex items-center bg-contrast rounded-xl cursor-pointer"
        role="button"
        onClick={onSubmit}>
        <div className="size-12 shrink-0 rounded-full bg-contrast" />
        <div className="w-4" />
        <div className="flex flex-col truncate">
          <div className="font-medium">
            {input}
          </div>
          <div className="text-contrast truncate">
            {maybeEns}
          </div>
        </div>
      </div>
    </>}
    <div className="h-4" />
    <div className="flex items-center">
      <button className="text-lg font-medium text-contrast data-[active=true]:text-default"
        onClick={onRecentsClick}
        data-active={mode === "recents"}>
        Recents
      </button>
      <div className="grow" />
      <button className="text-contrast font-medium text-contrast data-[active=true]:text-default"
        onClick={onContactsClick}
        data-active={mode === "contacts"}>
        Contacts
      </button>
    </div>
    <div className="h-2" />
    <div className="po-md flex items-center bg-contrast rounded-xl cursor-pointer"
      role="button"
      onClick={onBrumeClick}>
      <img className="size-12 shrink-0 rounded-full bg-contrast"
        src="/square.png"
        alt="logo" />
      <div className="w-4" />
      <div className="flex flex-col truncate">
        <div className="font-medium">
          Brume Wallet
        </div>
        <div className="text-contrast truncate">
          brume.eth
        </div>
      </div>
    </div>
    <div className="grow flex flex-col items-center justify-center">
      Coming soon...
    </div>
  </>
}

function SimpleBox(props: ChildrenProps) {
  const { children } = props

  return <div className="po-md flex items-start bg-contrast rounded-xl">
    {children}
  </div>
}

function SimpleInput(props: InputProps) {
  return <input className="grow bg-transparent outline-none" {...props} />
}

function SimpleTextarea(props: TextareaProps) {
  return <textarea className="grow bg-transparent outline-none" {...props} />
}

function ShrinkableNakedButtonInInputBox(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group rounded-full outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

function ShrinkableContrastButtonInInputBox(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function WalletSendScreenValue(props: {
  readonly step: ValueStep
  readonly setStep: Setter<Step>
  readonly tokenData: NativeTokenData
  readonly context: FgEthereumContext
}) {
  const { context, tokenData, step, setStep } = props
  const wallet = useWalletDataContext().unwrap()
  const { close } = useDialogContext().unwrap()

  const pendingNonceQuery = useNonce(wallet.address, context)
  const maybePendingNonce = pendingNonceQuery.data?.get()

  const [prices, setPrices] = useState(new Array<Nullable<Fixed.From>>(tokenData.pairs?.length ?? 0))

  const onPrice = useCallback(([index, data]: [number, Nullable<Fixed.From>]) => {
    setPrices(prices => {
      prices[index] = data
      return [...prices]
    })
  }, [])

  const maybeTokenPrice = useMemo(() => {
    if (prices.length === 0)
      return undefined

    return prices.reduce((a: Nullable<Fixed>, b: Nullable<Fixed.From>) => {
      if (a == null)
        return undefined
      if (b == null)
        return undefined
      return a.mul(Fixed.from(b))
    }, Fixed.unit(18))
  }, [prices])

  const [rawValueInput = "", setRawValueInput] = useState(step.valued)
  const [rawPricedInput = "", setRawPricedInput] = useState(step.priced)

  const setValue = useCallback((input: string) => {
    try {
      setRawValueInput(input)

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
  }, [tokenData, maybeTokenPrice])

  const setPrice = useCallback((input: string) => {
    try {
      setRawPricedInput(input)

      if (maybeTokenPrice == null) {
        setRawValueInput(undefined)
        return
      }

      const valued = Fixed.fromString(input, tokenData.decimals).div(maybeTokenPrice)

      if (valued.value === 0n) {
        setRawPricedInput(undefined)
        return
      }

      setRawValueInput(valued.toString())
    } catch (e: unknown) {
      setRawValueInput(undefined)
      return
    }
  }, [tokenData, maybeTokenPrice])

  const onValueInputChange = useInputChange(e => {
    setValue(e.target.value)
  }, [setValue])

  const onPricedInputChange = useInputChange(e => {
    setPrice(e.target.value)
  }, [setPrice])

  useEffect(() => {
    setStep(p => ({ ...p, valued: rawValueInput }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawValueInput])

  useEffect(() => {
    setStep(p => ({ ...p, priced: rawPricedInput }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPricedInput])

  const valueInput = useDeferredValue(rawValueInput)
  const pricedInput = useDeferredValue(rawPricedInput)

  const [mode, setMode] = useState<"valued" | "priced">("valued")

  const valuedBalanceQuery = useBalance(wallet.address, context, prices)
  const pricedBalanceQuery = usePricedBalance(wallet.address, "usd", context)

  const valuedBalanceData = valuedBalanceQuery.data?.get()
  const pricedBalanceData = pricedBalanceQuery.data?.get()

  const onValueMaxClick = useCallback(() => {
    if (valuedBalanceData == null)
      return
    setValue(Fixed.from(valuedBalanceData).toString())
  }, [valuedBalanceData, setValue])

  const onPricedMaxClick = useCallback(() => {
    if (pricedBalanceData == null)
      return
    setPrice(Fixed.from(pricedBalanceData).toString())
  }, [pricedBalanceData, setPrice])

  const onValuedPaste = useCallback(async () => {
    setValue(await navigator.clipboard.readText())
  }, [setValue])

  const onPricedPaste = useCallback(async () => {
    setPrice(await navigator.clipboard.readText())
  }, [setPrice])

  const onValuedClear = useCallback(async () => {
    setValue("")
  }, [setValue])

  const onPricedClear = useCallback(async () => {
    setPrice("")
  }, [setPrice])

  const onTargetFocus = useCallback(() => {
    setStep({ ...step, step: "target" })
  }, [step, setStep])

  const onNonceClick = useCallback(() => {
    setStep({ ...step, step: "nonce" })
  }, [step, setStep])

  const onPricedClick = useCallback(() => {
    setMode("priced")
  }, [])

  const onValuedClick = useCallback(() => {
    setMode("valued")
  }, [])

  const maybeEnsInput = step.target.endsWith(".eth")
    ? step.target
    : undefined

  const mainnet = useEthereumContext(wallet.uuid, chainByChainId[1])

  const ensTargetQuery = useEnsLookup(maybeEnsInput, mainnet)
  const maybeEnsTarget = ensTargetQuery.data?.get()

  const [gasMode, setGasMode] = useState<"normal" | "fast" | "urgent">("normal")

  const onGasModeChange = useCallback((e: SyntheticEvent<HTMLSelectElement>) => {
    setGasMode(e.currentTarget.value as any)
  }, [])

  const gasPriceQuery = useGasPrice(context)
  const maybeGasPrice = gasPriceQuery.data?.get()

  const maxPriorityFeePerGasQuery = useMaxPriorityFeePerGas(context)
  const maybeMaxPriorityFeePerGas = maxPriorityFeePerGasQuery.data?.get()

  const pendingBlockQuery = useBlockByNumber("pending", context)
  const maybePendingBlock = pendingBlockQuery.data?.inner

  const maybeIsEip1559 = maybePendingBlock != null
    ? maybePendingBlock.baseFeePerGas != null
    : undefined

  const maybeBaseFeePerGas = useMemo(() => {
    if (maybePendingBlock?.baseFeePerGas == null)
      return undefined
    return BigIntToHex.decodeOrThrow(maybePendingBlock.baseFeePerGas)
  }, [maybePendingBlock])

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
  }, [maybeBaseFeePerGas])

  const maybeFastBaseFeePerGas = useMaybeMemo((baseFeePerGas) => {
    return baseFeePerGas + (1n * (10n ** 9n))
  }, [maybeBaseFeePerGas])

  const maybeUrgentBaseFeePerGas = useMaybeMemo((baseFeePerGas) => {
    return baseFeePerGas + (2n * (10n ** 9n))
  }, [maybeBaseFeePerGas])

  const maybeNormalMaxPriorityFeePerGas = useMaybeMemo(() => {
    return 0n
  }, [maybeMaxPriorityFeePerGas])

  const maybeFastMaxPriorityFeePerGas = useMaybeMemo((maxPriorityFeePerGas) => {
    return maxPriorityFeePerGas / 2n
  }, [maybeMaxPriorityFeePerGas])

  const maybeUrgentMaxPriorityFeePerGas = useMaybeMemo((maxPriorityFeePerGas) => {
    return maxPriorityFeePerGas
  }, [maybeMaxPriorityFeePerGas])

  const maybeNormalGasPrice = useMaybeMemo((gasPrice) => {
    return gasPrice
  }, [maybeGasPrice])

  const maybeFastGasPrice = useMaybeMemo((gasPrice) => {
    return gasPrice + (gasPrice * (10n / 100n))
  }, [maybeGasPrice])

  const maybeUrgentGasPrice = useMaybeMemo((gasPrice) => {
    return gasPrice + (gasPrice * (20n / 100n))
  }, [maybeGasPrice])

  function useFinal(normal: Nullable<bigint>, fast: Nullable<bigint>, urgent: Nullable<bigint>) {
    return useMemo(() => {
      if (gasMode === "normal")
        return normal
      if (gasMode === "fast")
        return fast
      if (gasMode === "urgent")
        return urgent
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gasMode, normal, fast, urgent])
  }

  function useGasDisplay(gasPrice: Nullable<bigint>) {
    return useMemo(() => {
      if (gasPrice == null)
        return "???"
      return new Fixed(gasPrice, 9).move(0).toString()
    }, [gasPrice])
  }

  function usePriorityFeeDisplay(priorityFee: Nullable<bigint>) {
    return useMemo(() => {
      if (priorityFee == null)
        return "???"
      return new Fixed(priorityFee, 9).move(3).toString()
    }, [priorityFee])
  }

  function useCompactUsdDisplay(fixed: Nullable<Fixed>) {
    return useMemo(() => {
      if (fixed == null)
        return "???"
      return Number(fixed.move(2).toString()).toLocaleString(undefined, { style: "currency", currency: "USD", notation: "compact" })
    }, [fixed])
  }

  const maybeFinalGasPrice = useFinal(maybeNormalGasPrice, maybeFastGasPrice, maybeUrgentGasPrice)
  const maybeFinalBaseFeePerGas = useFinal(maybeNormalBaseFeePerGas, maybeFastBaseFeePerGas, maybeUrgentBaseFeePerGas)
  const maybeFinalMaxPriorityFeePerGas = useFinal(maybeNormalMaxPriorityFeePerGas, maybeFastMaxPriorityFeePerGas, maybeUrgentMaxPriorityFeePerGas)

  const maybeFinalMaxFeePerGas = useMemo(() => {
    if (maybeFinalBaseFeePerGas == null)
      return undefined
    if (maybeFinalMaxPriorityFeePerGas == null)
      return undefined
    return (maybeFinalBaseFeePerGas * 2n) + maybeFinalMaxPriorityFeePerGas
  }, [maybeFinalBaseFeePerGas, maybeFinalMaxPriorityFeePerGas])

  const maybeFinalValue = useMemo(() => {
    try {
      return Fixed.fromString(valueInput.trim() || "0", tokenData.decimals)
    } catch { }
  }, [valueInput, tokenData])

  const [rawNonceInput = "", setRawNonceInput] = useState<Optional<string>>(step.nonce)

  const onNonceInputChange = useInputChange(e => {
    setRawNonceInput(e.target.value)
  }, [])

  const nonceInput = useDeferredValue(rawNonceInput)

  const maybeCustomNonce = useMemo(() => {
    try {
      return BigInt(nonceInput.trim() || "0")
    } catch { }
  }, [nonceInput])

  const maybeFinalNonce = useMemo(() => {
    if (maybeCustomNonce != null)
      return maybeCustomNonce
    if (maybePendingNonce != null)
      return maybePendingNonce
    return undefined
  }, [maybeCustomNonce, maybePendingNonce])

  const finalNonceDisplay = useMemo(() => {
    return maybeFinalNonce?.toString() ?? "???"
  }, [maybeFinalNonce])

  const maybeFinalTarget = useMemo(() => {
    if (Address.is(step.target))
      return step.target
    if (maybeEnsTarget != null)
      return maybeEnsTarget
    return undefined
  }, [step.target, maybeEnsTarget])

  const maybeEip1559EstimateGasKey = useMemo<Nullable<RpcRequestPreinit<[unknown, unknown]>>>(() => {
    if (maybeFinalValue == null)
      return undefined
    if (maybeFinalNonce == null)
      return undefined
    if (maybeFinalMaxFeePerGas == null)
      return undefined
    if (maybeFinalMaxPriorityFeePerGas == null)
      return undefined

    return {
      method: "eth_estimateGas",
      params: [{
        chainId: ZeroHexString.from(context.chain.chainId),
        from: wallet.address,
        to: maybeFinalTarget,
        maxFeePerGas: ZeroHexString.from(maybeFinalMaxFeePerGas),
        maxPriorityFeePerGas: ZeroHexString.from(maybeFinalMaxPriorityFeePerGas),
        value: ZeroHexString.from(maybeFinalValue.value),
        nonce: ZeroHexString.from(maybeFinalNonce)
      }, "latest"]
    }
  }, [context, wallet, maybeFinalTarget, maybeFinalValue, maybeFinalNonce, maybeFinalMaxFeePerGas, maybeFinalMaxPriorityFeePerGas])

  const eip1559GasLimitQuery = useEstimateGas(maybeEip1559EstimateGasKey, context)
  const maybeEip1559GasLimit = eip1559GasLimitQuery.data?.get()

  const maybeNormalEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimit == null)
      return undefined
    if (maybeNormalBaseFeePerGas == null)
      return undefined
    if (maybeTokenPrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimit * maybeNormalBaseFeePerGas, 18).mul(maybeTokenPrice) // TODO use ETH price
  }, [maybeEip1559GasLimit, maybeNormalBaseFeePerGas, maybeTokenPrice])

  const maybeFastEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimit == null)
      return undefined
    if (maybeFastBaseFeePerGas == null)
      return undefined
    if (maybeTokenPrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimit * maybeFastBaseFeePerGas, 18).mul(maybeTokenPrice)
  }, [maybeEip1559GasLimit, maybeFastBaseFeePerGas, maybeTokenPrice])

  const maybeUrgentEip1559GasCost = useMemo(() => {
    if (maybeEip1559GasLimit == null)
      return undefined
    if (maybeUrgentBaseFeePerGas == null)
      return undefined
    if (maybeTokenPrice == null)
      return undefined
    return new Fixed(maybeEip1559GasLimit * maybeUrgentBaseFeePerGas, 18).mul(maybeTokenPrice)
  }, [maybeEip1559GasLimit, maybeUrgentBaseFeePerGas, maybeTokenPrice])

  const normalEip1559GasCostDisplay = useCompactUsdDisplay(maybeNormalEip1559GasCost)
  const fastEip1559GasCostDisplay = useCompactUsdDisplay(maybeFastEip1559GasCost)
  const urgentEip1559GasCostDisplay = useCompactUsdDisplay(maybeUrgentEip1559GasCost)

  const normalGasPriceDisplay = useGasDisplay(maybeNormalGasPrice)
  const fastGasPriceDisplay = useGasDisplay(maybeFastGasPrice)
  const urgentGasPriceDisplay = useGasDisplay(maybeUrgentGasPrice)

  const normalBaseFeePerGasDisplay = useGasDisplay(maybeNormalBaseFeePerGas)
  const fastBaseFeePerGasDisplay = useGasDisplay(maybeFastBaseFeePerGas)
  const urgentBaseFeePerGasDisplay = useGasDisplay(maybeUrgentBaseFeePerGas)

  const normalMaxPriorityFeePerGasDisplay = usePriorityFeeDisplay(maybeNormalMaxPriorityFeePerGas)
  const fastMaxPriorityFeePerGasDisplay = usePriorityFeeDisplay(maybeFastMaxPriorityFeePerGas)
  const urgentMaxPriorityFeePerGasDisplay = usePriorityFeeDisplay(maybeUrgentMaxPriorityFeePerGas)

  const [txHash, setTxHash] = useState<ZeroHexString>("0x19b896be5689b2b9fe34bb4e79ed7cedc4b0969de7606c95ecdc5aa18759d625")

  const onTxHashCopy = useCopy(txHash)

  const send = useAsyncUniqueCallback(async () => {
    try {
      if (maybeIsEip1559 == null)
        return

      const value = Option.wrap(maybeFinalValue).okOrElseSync(() => {
        return new UIError(`Could not parse value`)
      }).unwrap()

      const nonce = Option.wrap(maybeFinalNonce).okOrElseSync(() => {
        return new UIError(`Could not fetch or parse nonce`)
      }).unwrap()

      const target = Option.wrap(maybeFinalTarget).okOrElseSync(() => {
        return new UIError(`Could not fetch or parse address`)
      }).unwrap()

      let tx: ethers.Transaction

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

        const gasLimit = Option.wrap(maybeEip1559GasLimit).okOrElseSync(() => {
          return new UIError(`Could not fetch gasLimit`)
        }).unwrap()

        tx = Transaction.from({
          to: Address.from(target),
          gasLimit: gasLimit,
          chainId: context.chain.chainId,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas,
          nonce: Number(nonce),
          value: value.value
        })
      }

      /**
       * Not EIP-1559
       */
      else {
        const gasPrice = Option.wrap(maybeFinalGasPrice).okOrElseSync(() => {
          return new UIError(`Could not fetch gasPrice`)
        }).unwrap()

        const gas = await context.background.tryRequest<string>({
          method: "brume_eth_fetch",
          params: [context.uuid, context.chain.chainId, {
            method: "eth_estimateGas",
            params: [{
              chainId: ZeroHexString.from(context.chain.chainId),
              from: wallet.address,
              to: Address.from(target),
              gasPrice: ZeroHexString.from(gasPrice),
              value: ZeroHexString.from(value.value),
              nonce: ZeroHexString.from(nonce)
            }, "latest"],
            noCheck: true
          }]
        }).then(r => r.unwrap().unwrap())

        tx = Transaction.from({
          to: Address.from(target),
          gasLimit: gas,
          chainId: context.chain.chainId,
          gasPrice: gasPrice,
          nonce: Number(nonce),
          value: value.value
        })
      }

      const instance = await EthereumWalletInstance.tryFrom(wallet, context.background).then(r => r.unwrap())
      tx.signature = await instance.trySignTransaction(tx, context.background).then(r => r.unwrap())

      const txHash = await context.background.tryRequest<ZeroHexString>({
        method: "brume_eth_fetch",
        params: [context.uuid, context.chain.chainId, {
          method: "eth_sendRawTransaction",
          params: [tx.serialized],
          noCheck: true
        }]
      }).then(r => r.unwrap().unwrap())

      setTxHash(txHash)
    } catch (e) {
      Errors.logAndAlert(e)
    }
  }, [wallet, context, tokenData, maybeFinalTarget, maybeFinalNonce, maybeFinalValue, maybeIsEip1559, maybeEip1559GasLimit, maybeFinalMaxFeePerGas, maybeFinalMaxPriorityFeePerGas, maybeFinalGasPrice])

  return <>
    {tokenData.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        ok={onPrice} />)}
    <Dialog.Title close={close}>
      Send
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
        value={step.target} />
    </SimpleBox>
    <div className="h-2" />
    {mode === "valued" &&
      <SimpleBox>
        <div className="">
          Value
        </div>
        <div className="w-4" />
        <div className="grow flex flex-col">
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
            <div className="text-contrast">
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
        <div className="grow flex flex-col">
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
            <div className="text-contrast">
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
    <SimpleBox>
      <div className="">
        Data
      </div>
      <div className="w-4" />
      <SimpleTextarea
        rows={3}
        value={step.data}
        placeholder="0x0" />
    </SimpleBox>
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
      {maybeIsEip1559 === true && maybeBaseFeePerGas != null && maybeMaxPriorityFeePerGas != null &&
        <select className="w-full my-0.5 bg-transparent outline-none"
          value={gasMode}
          onChange={onGasModeChange}>
          <option value="urgent">
            {`Urgent — ${urgentBaseFeePerGasDisplay}:${urgentMaxPriorityFeePerGasDisplay} Gwei — ${urgentEip1559GasCostDisplay}`}
          </option>
          <option value="fast">
            {`Fast — ${fastBaseFeePerGasDisplay}:${fastMaxPriorityFeePerGasDisplay} Gwei — ${fastEip1559GasCostDisplay}`}
          </option>
          <option value="normal">
            {`Normal — ${normalBaseFeePerGasDisplay}:${normalMaxPriorityFeePerGasDisplay} Gwei — ${normalEip1559GasCostDisplay}`}
          </option>
          {/* <option value="custom">Custom</option> */}
        </select>}
      {maybeIsEip1559 === false && maybeGasPrice != null &&
        <select className="w-full my-0.5 bg-transparent outline-none">
          <option value="urgent">
            {`Urgent — ${urgentGasPriceDisplay} Gwei — $5`}
          </option>
          <option value="fast">
            {`Fast — ${fastGasPriceDisplay} Gwei — $5`}
          </option>
          <option value="normal">
            {`Normal — ${normalGasPriceDisplay} Gwei — $5`}
          </option>
          {/* <option value="custom">Custom</option> */}
        </select>}
    </SimpleBox>
    <div className="h-4 grow" />
    {txHash != null && <>
      <div className="po-md flex items-center bg-contrast rounded-xl">
        <div className="flex flex-col truncate">
          <div className="flex items-center">
            <Loading className="size-4 shrink-0" />
            <div className="w-2" />
            <div className="font-medium">
              Pending transaction #{finalNonceDisplay}
            </div>
          </div>
          <div className="text-contrast truncate">
            {txHash}
          </div>
          <div className="h-2" />
          <div className="flex items-center gap-1">
            <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
              onClick={onTxHashCopy.run}>
              <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
                Copy
                {onTxHashCopy.current
                  ? <Outline.CheckIcon className="size-4" />
                  : <Outline.ClipboardIcon className="size-4" />}
              </div>
            </button>
            <a className="group px-2 bg-contrast rounded-full"
              target="_blank" rel="noreferrer"
              href={`https://etherscan.io/tx/${txHash}`}>
              <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
                Etherscan
                <Outline.ArrowTopRightOnSquareIcon className="size-4" />
              </div>
            </a>
          </div>
        </div>
      </div>
      <div className="h-2" />
    </>}
    <div className="flex items-center">
      <WideShrinkableContrastButton>
        <Outline.PencilIcon className="size-5" />
        Sign
      </WideShrinkableContrastButton>
      <div className="w-2" />
      <WideShrinkableOppositeButton
        disabled={send.loading}
        onClick={send.run}>
        <Outline.PaperAirplaneIcon className="size-5" />
        Send
      </WideShrinkableOppositeButton>
    </div>
  </>
}

function WideShrinkableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="grow group po-md bg-opposite text-opposite rounded-xl outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

function WideShrinkableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="grow group po-md bg-contrast rounded-xl outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}


export function WalletSendScreenNonce(props: {
  readonly step: NonceStep
  readonly setStep: Setter<Step>
  readonly context: FgEthereumContext
}) {
  const { context, step, setStep } = props
  const wallet = useWalletDataContext().unwrap()
  const { close } = useDialogContext().unwrap()

  const pendingNonceQuery = useNonce(wallet.address, context)
  const maybePendingNonce = pendingNonceQuery.data?.get()

  const [rawInput = "", setRawInput] = useState<Optional<string>>(step.nonce)

  const onInputChange = useInputChange(e => {
    setRawInput(e.target.value)
  }, [])

  const input = useDeferredValue(rawInput)

  const onSubmit = useCallback(async () => {
    setStep({ ...step, step: "value", nonce: input })
  }, [step, setStep, input])

  const onEnter = useKeyboardEnter(() => {
    onSubmit()
  }, [onSubmit])

  const onClear = useCallback((e: SyntheticEvent) => {
    setRawInput("")
  }, [])

  const onPaste = useCallback(async () => {
    const input = await navigator.clipboard.readText()
    setStep({ ...step, step: "value", nonce: input })
  }, [step, setStep])

  return <>
    <Dialog.Title close={close}>
      Send
    </Dialog.Title>
    <div className="h-4" />
    <SimpleBox>
      <div className="">
        Nonce
      </div>
      <div className="w-4" />
      <SimpleInput
        autoFocus
        value={rawInput}
        onChange={onInputChange}
        onKeyDown={onEnter}
        placeholder={maybePendingNonce?.toString()} />
      <div className="w-1" />
      <div className="flex items-center">
        {rawInput.length === 0
          ? <ShrinkableNakedButtonInInputBox
            onClick={onPaste}>
            <Outline.ClipboardIcon className="size-4" />
          </ShrinkableNakedButtonInInputBox>
          : <ShrinkableNakedButtonInInputBox
            onClick={onClear}>
            <Outline.XMarkIcon className="size-4" />
          </ShrinkableNakedButtonInInputBox>}
        <div className="w-1" />
        <ShrinkableContrastButtonInInputBox
          onClick={onSubmit}>
          OK
        </ShrinkableContrastButtonInInputBox>
      </div>
    </SimpleBox>
    <div className="h-4" />
    <div className="text-lg font-medium">
      Pending transactions
    </div>
    <div className="grow flex flex-col items-center justify-center">
      Coming soon...
    </div>
  </>
}