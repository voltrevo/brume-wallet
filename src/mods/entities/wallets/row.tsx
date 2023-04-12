import { useFromColor } from "@/libs/colors/from-color"
import { useToColor } from "@/libs/colors/to-colors"
import { useHash } from "@/libs/hash/hash"
import { ColorButton } from "@/mods/components/buttons/button"
import { WalletIcon } from "./avatar"
import { WalletProps, useWallet } from "./data"

namespace Ethereum {
  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
}

namespace Bitcoin {
  export function format(address: string) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
}

export function WalletRow(props: WalletProps) {
  const wallet = useWallet(props.wallet.address)
  const hash = useHash(props.wallet.address)
  const fromColor = useFromColor(hash)
  const toColor = useToColor(hash + 1)

  if (!wallet.data) return null

  const First =
    <div className="flex items-center">
      <div className="shrink-0 self-baseline pt-1">
        <WalletIcon className="text-4xl" />
      </div>
      <div className="w-4" />
      <h2 className="text-xl font-medium truncate">
        {wallet.data.name}
      </h2>
      <div className="w-4 grow" />
      <div className="text-xl font-bold">
        $0
      </div>
    </div>

  const Second =
    <div className="">
      <div className="flex justify-between items-center text-sm truncate">
        <div className="">
          Bitcoin
        </div>
        <div className="">
          {Bitcoin.format("1Fok5LTPLBdKmgrMquvvUyLc9jp5qsBnrd")}
        </div>
      </div>
      <div className="flex justify-between items-center text-sm truncate">
        <div className="">
          Ethereum
        </div>
        <div className="">
          {Ethereum.format(wallet.data.address)}
        </div>
      </div>
    </div>

  return <ColorButton className={`w-full text-left text-opposite bg-gradient-to-br ${fromColor} ${toColor}`}>
    <div className="truncate grow">
      {First}
      <div className="h-8" />
      {Second}
    </div>
  </ColorButton>
}
