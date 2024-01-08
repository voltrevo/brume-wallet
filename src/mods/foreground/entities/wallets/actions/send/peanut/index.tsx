import { usePathState, useSearchState } from "@/mods/foreground/router/path/context"
import { WalletSendScreenNonce } from "../direct/nonce"
import { WalletPeanutSendScreenNativeValue } from "./value/native"

export type UrlState = {
  readonly step?: string
  readonly chain?: string
  readonly token?: string
  readonly valued?: string
  readonly priced?: string
  readonly nonce?: string
  readonly gasMode?: string
  readonly gasLimit?: string
  readonly gasPrice?: string
  readonly baseFeePerGas?: string
  readonly maxPriorityFeePerGas?: string
}

export function WalletPeanutSendScreen(props: {}) {
  const $path = usePathState<UrlState>()
  const [step] = useSearchState("step", $path)
  const [token] = useSearchState("token", $path)

  if (step === "value" && token == null)
    return <WalletPeanutSendScreenNativeValue />
  // if (step === "value" && token != null)
  //   return <WalletSendScreenContractValue />
  if (step === "nonce")
    return <WalletSendScreenNonce />
  return null
}