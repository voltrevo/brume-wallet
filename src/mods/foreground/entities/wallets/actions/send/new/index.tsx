/* eslint-disable @next/next/no-img-element */
import { ChildrenProps } from "@/libs/react/props/children";
import { ButtonProps, InputProps, TextareaProps } from "@/libs/react/props/html";
import { usePathState, useSearchState } from "@/mods/foreground/router/path/context";
import { WalletSendScreenNonce } from "./nonce";
import { WalletSendScreenTarget } from "./target";
import { WalletSendScreenContractValue } from "./value/contract";
import { WalletSendScreenNativeValue } from "./value/native";

export type UrlState = {
  readonly step?: string
  readonly chain?: string
  readonly token?: string
  readonly target?: string
  readonly valued?: string
  readonly priced?: string
  readonly nonce?: string
  readonly data?: string
}

export function WalletSendScreen(props: {}) {
  const $path = usePathState<UrlState>()
  const [step] = useSearchState("step", $path)
  const [token] = useSearchState("token", $path)

  if (step === "target")
    return <WalletSendScreenTarget />
  if (step === "value" && token == null)
    return <WalletSendScreenNativeValue />
  if (step === "value" && token != null)
    return <WalletSendScreenContractValue />
  if (step === "nonce")
    return <WalletSendScreenNonce />
  return <WalletSendScreenTarget />
}

export function SimpleBox(props: ChildrenProps) {
  const { children } = props

  return <div className="po-md flex items-start bg-contrast rounded-xl">
    {children}
  </div>
}

export function SimpleInput(props: InputProps) {
  return <input className="grow bg-transparent outline-none min-w-0" {...props} />
}

export function SimpleTextarea(props: TextareaProps) {
  return <textarea className="grow bg-transparent outline-none min-w-0" {...props} />
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

export function WideShrinkableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="grow group po-md bg-opposite text-opposite rounded-xl outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function WideShrinkableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="grow group po-md bg-contrast rounded-xl outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}
