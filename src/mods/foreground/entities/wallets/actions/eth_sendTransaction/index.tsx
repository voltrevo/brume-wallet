import { usePathState, useSearchState } from "@/mods/foreground/router/path/context"
import { WalletSendScreenNonce } from "../send/nonce"
import { WalletSendScreenTarget } from "../send/target"
import { WalletSendTransactionScreenValue } from "./screen"

export type UrlState = {
  readonly uuid?: string
  readonly type?: string
  readonly step?: string
  readonly chain?: string
  readonly token?: string
  readonly target?: string
  readonly value?: string
  readonly valued?: string
  readonly priced?: string
  readonly nonce?: string
  readonly data?: string
  readonly gasMode?: string
  readonly gasLimit?: string
  readonly gasPrice?: string
  readonly baseFeePerGas?: string
  readonly maxPriorityFeePerGas?: string
  readonly disableTarget?: string
  readonly disableValue?: string
  readonly disableData?: string
  readonly disableSign?: string
}

export function WalletSendTransactionScreen(props: {}) {
  const $path = usePathState<UrlState>()
  const [step] = useSearchState("step", $path)

  if (step === "target")
    return <WalletSendScreenTarget />
  if (step === "value")
    return <WalletSendTransactionScreenValue />
  if (step === "nonce")
    return <WalletSendScreenNonce />
  return null
}