/* eslint-disable @next/next/no-img-element */
import { ChildrenProps } from "@/libs/react/props/children";
import { InputProps, TextareaProps } from "@/libs/react/props/html";
import { usePathContext, useSearchState } from "@hazae41/chemin";
import { WalletDirectSendScreenContractValue } from "./direct/contract";
import { WalletDirectSendScreenNativeValue } from "./direct/native";
import { WalletPeanutSendScreenContractValue } from "./peanut/contract";
import { WalletPeanutSendScreenNativeValue } from "./peanut/native";
import { WalletSendScreenTarget } from "./target";

export function WalletSendScreen(props: {}) {
  const path = usePathContext().getOrThrow()

  const [step] = useSearchState(path, "step")
  const [type] = useSearchState(path, "type")
  const [token] = useSearchState(path, "token")

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


