import { GrowButton } from "@/mods/components/buttons/button"
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

  return <GrowButton className="w-full text-left">
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
  </GrowButton>
}
