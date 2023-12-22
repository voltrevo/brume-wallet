import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useInputChange, useKeyboardEnter } from "@/libs/react/events";
import { ChildrenProps } from "@/libs/react/props/children";
import { ButtonProps, InputProps } from "@/libs/react/props/html";
import { Setter } from "@/libs/react/state";
import { Dialog, useDialogContext } from "@/libs/ui/dialog/dialog";
import { NativeTokenData } from "@/mods/background/service_worker/entities/tokens/data";
import { Address, Fixed } from "@hazae41/cubane";
import { Nullable, Optional } from "@hazae41/option";
import { SyntheticEvent, useCallback, useDeferredValue, useEffect, useState } from "react";
import { useWalletDataContext } from "../../context";
import { FgEthereumContext, useBalance, useEnsLookup, useEthereumContext, useNonce, usePricedBalance } from "../../data";
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
}

type ValueStep = {
  readonly step: "value",
  readonly target: string
  readonly valued?: string
  readonly priced?: string
  readonly nonce?: string
}

type NonceStep = {
  readonly step: "nonce",
  readonly target: string
  readonly valued?: string
  readonly priced?: string
  readonly nonce?: string
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
  const maybeEnsData = ensQuery.data?.get()

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

  return <>
    <Dialog.Title close={close}>
      Send
    </Dialog.Title>
    <div className="h-4" />
    <SimpleInputBox>
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
      <div className="w-2" />
      {rawInput.length === 0
        ? <ShrinkableNakedButtonInInputBox
          onClick={onPaste}>
          <Outline.ClipboardIcon className="size-4" />
        </ShrinkableNakedButtonInInputBox>
        : <ShrinkableNakedButtonInInputBox
          onClick={onClear}>
          <Outline.XMarkIcon className="size-4" />
        </ShrinkableNakedButtonInInputBox>}
    </SimpleInputBox>
    {maybeEnsData != null && <>
      <div className="h-2" />
      <div className="po-md flex items-center bg-contrast rounded-xl cursor-pointer"
        role="button"
        onClick={onSubmit}>
        <div className="size-12 rounded-full bg-contrast" />
        <div className="w-4" />
        <div className="flex flex-col">
          <div className="font-medium">
            {input}
          </div>
          <div className="text-contrast">
            {maybeEnsData}
          </div>
        </div>
      </div>
    </>}
    <div className="h-4" />
    <div className="text-lg font-medium">
      Recent
    </div>
    <div className="grow flex flex-col items-center justify-center">
      Coming soon...
    </div>
    <div className="h-4" />
    <div className="text-lg font-medium">
      Contacts
    </div>
    <div className="grow flex flex-col items-center justify-center">
      Coming soon...
    </div>
  </>
}

function SimpleInputBox(props: ChildrenProps) {
  const { children } = props

  return <div className="po-md flex items-center bg-contrast rounded-full">
    {children}
  </div>
}

function SimpleInput(props: InputProps) {
  return <input className="grow bg-transparent outline-none" {...props} />
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
  const { tokenData, step, setStep } = props
  const wallet = useWalletDataContext().unwrap()
  const { close } = useDialogContext().unwrap()

  const chainData = chainByChainId[tokenData.chainId]
  const context = useEthereumContext(wallet.uuid, chainData)

  const nonceQuery = useNonce(wallet.address, context)
  const nonceData = nonceQuery.data?.get()

  const [prices, setPrices] = useState(new Array<Nullable<Fixed.From>>(tokenData.pairs?.length ?? 0))

  const onPrice = useCallback(([index, data]: [number, Nullable<Fixed.From>]) => {
    setPrices(prices => {
      prices[index] = data
      return [...prices]
    })
  }, [])

  const [rawValueInput = "", setRawValueInput] = useState(step.valued)
  const [rawPricedInput = "", setRawPricedInput] = useState(step.priced)

  const onValueInputChange = useInputChange(e => {
    onValueChange(e.target.value)
  }, [])

  const onPricedInputChange = useInputChange(e => {
    onPriceChange(e.target.value)
  }, [prices])

  useEffect(() => {
    setStep(p => ({ ...p, valued: rawValueInput }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawValueInput])

  useEffect(() => {
    setStep(p => ({ ...p, priced: rawPricedInput }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPricedInput])

  const onValueChange = useCallback((input: string) => {
    setRawValueInput(input)

    let priced = Fixed.fromString(input, tokenData.decimals)

    for (const price of prices) {
      if (price == null)
        return
      priced = priced.mul(Fixed.from(price))
    }

    if (priced.value > 0n)
      setRawPricedInput(priced.toString())
    else
      setRawPricedInput(undefined)
  }, [tokenData, prices])

  const onPriceChange = useCallback((input: string) => {
    setRawPricedInput(input)

    let valued = Fixed.fromString(input, tokenData.decimals)

    for (const price of prices) {
      if (price == null)
        return
      valued = valued.div(Fixed.from(price))
    }

    if (valued.value > 0n)
      setRawValueInput(valued.toString())
    else
      setRawValueInput(undefined)
  }, [tokenData, prices])

  const valueInput = useDeferredValue(rawValueInput)
  const pricedInput = useDeferredValue(rawPricedInput)

  const valuedBalanceQuery = useBalance(wallet.address, context, prices)
  const pricedBalanceQuery = usePricedBalance(wallet.address, "usd", context)

  const valuedBalanceData = valuedBalanceQuery.data?.get()
  const pricedBalanceData = pricedBalanceQuery.data?.get()

  const onValueMaxClick = useCallback(() => {
    if (valuedBalanceData == null)
      return
    onValueChange(Fixed.from(valuedBalanceData).toString())
  }, [valuedBalanceData, onValueChange])

  const onPricedMaxClick = useCallback(() => {
    if (pricedBalanceData == null)
      return
    onPriceChange(Fixed.from(pricedBalanceData).toString())
  }, [pricedBalanceData, onPriceChange])

  const onValuedPaste = useCallback(async () => {
    setRawValueInput(await navigator.clipboard.readText())
  }, [])

  const onPricedPaste = useCallback(async () => {
    setRawPricedInput(await navigator.clipboard.readText())
  }, [])

  const onValuedClear = useCallback(async () => {
    setRawValueInput("")
  }, [])

  const onPricedClear = useCallback(async () => {
    setRawPricedInput("")
  }, [])

  const onTargetFocus = useCallback(() => {
    setStep({ ...step, step: "target" })
  }, [step, setStep])

  const onNonceClick = useCallback(() => {
    setStep({ ...step, step: "nonce" })
  }, [step, setStep])

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
    <SimpleInputBox>
      <div className="">
        Target
      </div>
      <div className="w-4" />
      <SimpleInput key="target"
        onFocus={onTargetFocus}
        value={step.target} />
    </SimpleInputBox>
    <div className="h-4" />
    <SimpleInputBox>
      <div className="">
        ETH
      </div>
      <div className="w-4" />
      <SimpleInput
        autoFocus
        value={rawValueInput}
        onChange={onValueInputChange}
        placeholder="0.0" />
      <div className="w-2" />
      {rawValueInput.length === 0
        ? <ShrinkableNakedButtonInInputBox
          onClick={onValuedPaste}>
          <Outline.ClipboardIcon className="size-4" />
        </ShrinkableNakedButtonInInputBox>
        : <ShrinkableNakedButtonInInputBox
          onClick={onValuedClear}>
          <Outline.XMarkIcon className="size-4" />
        </ShrinkableNakedButtonInInputBox>}
      <div className="w-2" />
      <ShrinkableContrastButtonInInputBox
        disabled={valuedBalanceQuery.data == null}
        onClick={onValueMaxClick}>
        100%
      </ShrinkableContrastButtonInInputBox>
    </SimpleInputBox>
    <div className="h-2" />
    <SimpleInputBox>
      <div className="">
        USD
      </div>
      <div className="w-4" />
      <SimpleInput
        value={rawPricedInput}
        onChange={onPricedInputChange}
        placeholder="0.0" />
      <div className="w-2" />
      {rawPricedInput.length === 0
        ? <ShrinkableNakedButtonInInputBox
          onClick={onPricedPaste}>
          <Outline.ClipboardIcon className="size-4" />
        </ShrinkableNakedButtonInInputBox>
        : <ShrinkableNakedButtonInInputBox
          onClick={onPricedClear}>
          <Outline.XMarkIcon className="size-4" />
        </ShrinkableNakedButtonInInputBox>}
      <div className="w-2" />
      <ShrinkableContrastButtonInInputBox
        disabled={pricedBalanceQuery.data == null}
        onClick={onPricedMaxClick}>
        100%
      </ShrinkableContrastButtonInInputBox>
    </SimpleInputBox>
    <div className="h-4" />
    <SimpleInputBox>
      <div className="">
        Nonce
      </div>
      <div className="w-4" />
      <SimpleInput
        value={step.nonce}
        placeholder={nonceData?.toString()} />
      <div className="w-2" />
      <ShrinkableContrastButtonInInputBox
        onClick={onNonceClick}>
        Replace
      </ShrinkableContrastButtonInInputBox>
    </SimpleInputBox>
  </>
}

export function WalletSendScreenNonce(props: {
  readonly step: NonceStep
  readonly setStep: Setter<Step>
  readonly context: FgEthereumContext
}) {
  const { context, step, setStep } = props
  const wallet = useWalletDataContext().unwrap()
  const { close } = useDialogContext().unwrap()

  const nonceQuery = useNonce(wallet.address, context)
  const nonceData = nonceQuery.data?.get()

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

    setRawInput(input)
  }, [setStep])

  return <>
    <Dialog.Title close={close}>
      Send
    </Dialog.Title>
    <div className="h-4" />
    <SimpleInputBox>
      <div className="">
        Nonce
      </div>
      <div className="w-4" />
      <SimpleInput
        autoFocus
        value={rawInput}
        onChange={onInputChange}
        onKeyDown={onEnter}
        placeholder={nonceData?.toString()} />
      <div className="w-2" />
      {rawInput.length === 0
        ? <ShrinkableNakedButtonInInputBox
          onClick={onPaste}>
          <Outline.ClipboardIcon className="size-4" />
        </ShrinkableNakedButtonInInputBox>
        : <ShrinkableNakedButtonInInputBox
          onClick={onClear}>
          <Outline.XMarkIcon className="size-4" />
        </ShrinkableNakedButtonInInputBox>}
    </SimpleInputBox>
    <div className="h-4" />
    <div className="text-lg font-medium">
      Pending transactions
    </div>
    <div className="grow flex flex-col items-center justify-center">
      Coming soon...
    </div>
  </>
}