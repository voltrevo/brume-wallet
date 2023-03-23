import { ChevronRightIcon } from "@heroicons/react/24/outline"
import { WalletAvatar } from "./avatar"
import { useWallet, WalletProps } from "./data"

export function WalletRow(props: WalletProps) {
  const wallet = useWallet(props.wallet.address)

  if (!wallet.data) return null

  const First =
    <h2 className="truncate">
      {wallet.data.name}
    </h2>

  const Second =
    <div className="text-contrast truncate">
      {wallet.data.address}
    </div>

  return <div className="p-md flex items-center gap-2 rounded-xl bg-component border border-default">
    <div className="shrink-0">
      <WalletAvatar
        size={2.5}
        textSize={1.5}
        address={wallet.data.address} />
    </div>
    <div className="truncate grow">
      {First}
      {Second}
    </div>
    <ChevronRightIcon className="icon-sm shrink-0" />
  </div>
}
