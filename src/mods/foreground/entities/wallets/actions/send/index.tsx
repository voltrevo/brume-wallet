import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useInputChange, useKeyboardEnter } from "@/libs/react/events";
import { ChildrenProps } from "@/libs/react/props/children";
import { ButtonProps, InputProps } from "@/libs/react/props/html";
import { StateProps } from "@/libs/react/props/state";
import { Dialog, useDialogContext } from "@/libs/ui/dialog/dialog";
import { NativeTokenData } from "@/mods/background/service_worker/entities/tokens/data";
import { Address, Fixed } from "@hazae41/cubane";
import { Nullable, Optional } from "@hazae41/option";
import { useCallback, useDeferredValue, useState } from "react";
import { useWalletDataContext } from "../../context";
import { useBalance, useEthereumContext, usePricedBalance } from "../../data";
import { PriceResolver } from "../../page";

type Step = {
  readonly step: "target"
  readonly target?: Address
} | {
  readonly step: "value",
  readonly target: Address
}

export function WalletSendScreen(props: { readonly token: NativeTokenData }) {
  const { token } = props

  const [step, setStep] = useState<Step>({ step: "target" })

  if (step.step === "target")
    return <WalletSendScreenTarget
      step={step}
      setStep={setStep} />
  if (step.step === "value")
    return <WalletSendScreenValue
      tokenData={token}
      step={step}
      setStep={setStep} />
  return null
}

export function WalletSendScreenTarget(props: StateProps<"step", "setStep", Step>) {
  const { step, setStep } = props
  const { close } = useDialogContext().unwrap()

  const [rawInput = "", setRawInput] = useState<Optional<string>>(step.target)

  const onInputChange = useInputChange(e => {
    setRawInput(e.target.value)
  }, [])

  const input = useDeferredValue(rawInput)

  const onBlur = useCallback(() => {
    if (!Address.is(input))
      return
    setStep({ step: "value", target: input })
  }, [setStep, input])

  const onEnter = useKeyboardEnter(() => {
    if (!Address.is(input))
      return
    setStep({ step: "value", target: input })
  }, [setStep, input])

  const onClear = useCallback(() => {
    setRawInput("")
  }, [])

  const onPaste = useCallback(async () => {
    const input = await navigator.clipboard.readText()

    setRawInput(input)

    if (!Address.is(input))
      return
    setStep({ step: "value", target: input })
  }, [setStep])

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
        onBlur={onBlur}
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

export function WalletSendScreenValue(props: StateProps<"step", "setStep", Step> & { readonly tokenData: NativeTokenData }) {
  const { tokenData, step, setStep } = props
  const wallet = useWalletDataContext().unwrap()
  const { close } = useDialogContext().unwrap()

  const chainData = chainByChainId[tokenData.chainId]
  const context = useEthereumContext(wallet.uuid, chainData)

  const [prices, setPrices] = useState(new Array<Nullable<Fixed.From>>(tokenData.pairs?.length ?? 0))

  const onPrice = useCallback(([index, data]: [number, Nullable<Fixed.From>]) => {
    setPrices(prices => {
      prices[index] = data
      return [...prices]
    })
  }, [])

  const [rawValueInput = "", setRawValueInput] = useState<string>()
  const [rawPricedInput = "", setRawPricedInput] = useState<string>()

  const onValueInputChange = useInputChange(e => {
    let priced = Fixed.fromString(e.target.value, tokenData.decimals)

    setRawValueInput(e.target.value)

    for (const price of prices) {
      if (price == null)
        return
      priced = priced.mul(Fixed.from(price))
    }

    if (priced.value > 0n)
      setRawPricedInput(priced.toString())
    else
      setRawPricedInput(undefined)
  }, [])

  const valueInput = useDeferredValue(rawValueInput)

  const onPricedInputChange = useInputChange(e => {
    let valued = Fixed.fromString(e.target.value, tokenData.decimals)

    setRawPricedInput(e.target.value)

    for (const price of prices) {
      if (price == null)
        return
      valued = valued.div(Fixed.from(price))
    }

    if (valued.value > 0n)
      setRawValueInput(valued.toString())
    else
      setRawValueInput(undefined)
  }, [prices])

  const pricedInput = useDeferredValue(rawPricedInput)

  const valuedBalanceQuery = useBalance(wallet.address, context, prices)
  const pricedBalanceQuery = usePricedBalance(wallet.address, "usd", context)

  const onTargetFocus = useCallback(() => {
    setStep(p => ({ ...p, step: "target" }))
  }, [setStep])

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
      <div className="w-4" />
      <ShrinkableContrastButtonInInputBox>
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
      <div className="w-4" />
      <ShrinkableContrastButtonInInputBox>
        100%
      </ShrinkableContrastButtonInInputBox>
    </SimpleInputBox>
    <div className="grow" />
  </>
}