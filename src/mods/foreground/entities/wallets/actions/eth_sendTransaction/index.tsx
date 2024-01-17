import { usePathState, useSearchState } from "@/mods/foreground/router/path/context"
import { WalletTransactionScreenDecode } from "./decode"
import { WalletTransactionScreenNonce } from "./nonce"
import { WalletTransactionScreenValue } from "./value"

export type UrlState = {
  readonly trial?: string
  readonly step?: string
  readonly chain?: string
  readonly target?: string
  readonly value?: string
  readonly nonce?: string
  readonly data?: string
  readonly gasMode?: string
  readonly gasLimit?: string
  readonly gasPrice?: string
  readonly baseFeePerGas?: string
  readonly maxPriorityFeePerGas?: string
  readonly disableData?: string
  readonly disableSign?: string
}

export function WalletTransactionScreen(props: {}) {
  const $path = usePathState<UrlState>()
  const [step] = useSearchState("step", $path)

  if (step === "value")
    return <WalletTransactionScreenValue />
  if (step === "nonce")
    return <WalletTransactionScreenNonce />
  if (step === "decode")
    return <WalletTransactionScreenDecode />
  return null
}