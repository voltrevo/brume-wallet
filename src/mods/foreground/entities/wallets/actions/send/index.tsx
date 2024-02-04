/* eslint-disable @next/next/no-img-element */
import { Color, Gradient } from "@/libs/colors/colors";
import { ChildrenProps } from "@/libs/react/props/children";
import { AnchorProps, ButtonProps, InputProps, TextareaProps } from "@/libs/react/props/html";
import { useKeyValueState, usePathState } from "@/mods/foreground/router/path/context";
import { WalletDirectSendScreenContractValue } from "./direct/contract";
import { WalletDirectSendScreenNativeValue } from "./direct/native";
import { WalletPeanutSendScreenContractValue } from "./peanut/contract";
import { WalletPeanutSendScreenNativeValue } from "./peanut/native";
import { WalletSendScreenTarget } from "./target";

export type UrlState = {
  readonly type?: string
  readonly step?: string
  readonly chain?: string
  readonly token?: string
  readonly target?: string
  readonly value?: string
  readonly trial0?: string
  readonly trial1?: string
  readonly password?: string
}

export function WalletSendScreen(props: {}) {
  const $path = usePathState<UrlState>()
  const [step] = useKeyValueState("step", $path)
  const [type] = useKeyValueState("type", $path)
  const [token] = useKeyValueState("token", $path)

  if (step === "target")
    return <WalletSendScreenTarget />
  if (step === "value" && token == null && type == null)
    return <WalletDirectSendScreenNativeValue />
  if (step === "value" && token == null && type == "peanut")
    return <WalletPeanutSendScreenNativeValue />
  if (step === "value" && token != null && type == null)
    return <WalletDirectSendScreenContractValue />
  if (step === "value" && token != null && type == "peanut")
    return <WalletPeanutSendScreenContractValue />
  return null
}

export function SimpleLabel(props: ChildrenProps) {
  const { children } = props

  return <label className="po-md flex items-start bg-contrast rounded-xl">
    {children}
  </label>
}

export function SimpleInput(props: InputProps) {
  return <input className="grow bg-transparent outline-none min-w-0 disabled:text-contrast"
    {...props} />
}

export function SimpleTextarea(props: TextareaProps) {
  return <textarea className="grow bg-transparent outline-none min-w-0 disabled:text-contrast"
    {...props} />
}

export function RoundedShrinkableNakedButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group rounded-full outline-none enabled:hover:bg-contrast focus-visible:bg-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function RoundedShrinkableNakedAnchor(props: ChildrenProps & AnchorProps) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="group rounded-full outline-none aria-[disabled=false]:hover:bg-contrast focus-visible:bg-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
      {children}
    </div>
  </a>
}

export function PaddedRoundedShrinkableNakedButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group rounded-full p-2 outline-none enabled:hover:bg-contrast focus-visible:bg-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function PaddedRoundedShrinkableNakedAnchor(props: ChildrenProps & AnchorProps) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="group rounded-full p-2 outline-none aria-[disabled=false]:hover:bg-contrast focus-visible:bg-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
      {children}
    </div>
  </a>
}

export function ShrinkableContrastButtonInInputBox(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function WideShrinkableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-md bg-opposite text-opposite rounded-xl outline-none whitespace-nowrap enabled:hover:bg-opposite-hover focus-visible:outline-opposite disabled:opacity-50 transition-opacity"
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function WideShrinkableGradientButton(props: ChildrenProps & ButtonProps & { color: Color }) {
  const { children, color, ...rest } = props

  const [color1, color2] = Gradient.get(color)

  return <button className={`flex-1 group po-md bg-gradient-to-r from-${color1}-400 to-${color2}-400 dark:from-${color1}-500 dark:to-${color2}-500 text-white rounded-xl outline-none whitespace-nowrap enabled:hover:bg-${color}-400/90 focus-visible:outline-${color}-400 dark:enabled:hover:bg-${color}-500/90 dark:focus-visible:outline-${color}-500 disabled:opacity-50 transition-opacity`}
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function WideShrinkableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-md bg-contrast rounded-xl outline-none whitespace-nowrap enabled:hover:bg-contrast-hover focus-visible:outline-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function WideShrinkableNakedMenuButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-md rounded-xl outline-none whitespace-nowrap enabled:hover:bg-contrast focus-visible:bg-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <div className="h-full w-full flex items-center justify-start gap-4 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function WideShrinkableNakedMenuAnchor(props: ChildrenProps & AnchorProps) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="flex-1 group po-md rounded-xl outline-none whitespace-nowrap aria-[disabled=false]:hover:bg-contrast focus-visible:bg-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <div className="h-full w-full flex items-center justify-start gap-4 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
      {children}
    </div>
  </a>
}
