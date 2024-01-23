/* eslint-disable @next/next/no-img-element */
import { ChildrenProps } from "@/libs/react/props/children";
import { ButtonProps, InputProps, TextareaProps } from "@/libs/react/props/html";
import { usePathState, useSearchState } from "@/mods/foreground/router/path/context";
import { WalletDirectSendScreenContractValue } from "./direct/contract";
import { WalletDirectSendScreenNativeValue } from "./direct/screen";
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
  const [step] = useSearchState("step", $path)
  const [type] = useSearchState("type", $path)
  const [token] = useSearchState("token", $path)

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

export function SimpleBox(props: ChildrenProps) {
  const { children } = props

  return <div className="po-md flex items-start bg-contrast rounded-xl">
    {children}
  </div>
}

export function SimpleInput(props: InputProps) {
  return <input className="grow bg-transparent outline-none min-w-0 disabled:text-contrast" {...props} />
}

export function SimpleTextarea(props: TextareaProps) {
  return <textarea className="grow bg-transparent outline-none min-w-0 disabled:text-contrast" {...props} />
}

export function ShrinkableNakedButtonInInputBox(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group rounded-full outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function ShrinkableContrastButtonInInputBox(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function ShrinkableContrastButtonInTextareaBox(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-sm bg-contrast rounded-xl outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function WideShrinkableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="grow group po-md bg-opposite text-opposite rounded-xl outline-none focus-visible:outline-opposite disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function WideShrinkableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="grow group po-md bg-contrast rounded-xl outline-none focus-visible:outline-opposite disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}
