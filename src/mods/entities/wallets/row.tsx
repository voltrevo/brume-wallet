import { Bitcoin } from "@/libs/bitcoin/bitcoin"
import { FromColors } from "@/libs/colors/from-color"
import { ToColors } from "@/libs/colors/to-colors"
import { Ethereum } from "@/libs/ethereum/ethereum"
import { useModhash } from "@/libs/modhash/modhash"
import { ColorButton } from "@/mods/components/buttons/button"
import { WalletIcon } from "./avatar"
import { WalletProps, useWallet } from "./data"

export function WalletRow(props: WalletProps) {
  const wallet = useWallet(props.wallet.uuid)

  const modhash = useModhash(props.wallet.uuid)
  const fromColor = FromColors.get(modhash)
  const toColor = ToColors.get(modhash + 1)

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
          {Bitcoin.Address.format(wallet.data.bitcoinAddress)}
        </div>
      </div>
      <div className="flex justify-between items-center text-sm truncate">
        <div className="">
          Ethereum
        </div>
        <div className="">
          {Ethereum.Address.format(wallet.data.ethereumAddress)}
        </div>
      </div>
    </div>

  return <ColorButton className={`w-full text-left text-opposite bg-gradient-to-br ${fromColor} ${toColor}`}>
    <div className="truncate grow">
      {First}
      <div className="h-20" />
      {Second}
    </div>
  </ColorButton>
}
