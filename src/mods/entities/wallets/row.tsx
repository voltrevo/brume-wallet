import { Bitcoin } from "@/libs/bitcoin/bitcoin"
import { FromColors } from "@/libs/colors/from-color"
import { ToColors } from "@/libs/colors/to-colors"
import { useCopy } from "@/libs/copy/copy"
import { Ethereum } from "@/libs/ethereum/ethereum"
import { Events } from "@/libs/react/events"
import { WalletIcon } from "./avatar"
import { WalletDataProps } from "./data"

export function WalletCard(props: WalletDataProps) {
  const { wallet } = props

  const fromColor = FromColors.get(wallet.modhash)
  const toColor = ToColors.get(wallet.modhash + 1)

  const copyBitcoinAddress = useCopy(wallet.bitcoinAddress)
  const copyEthereumAddress = useCopy(wallet.ethereumAddress)

  const First =
    <div className="flex items-center">
      <div className="shrink-0">
        <WalletIcon className="text-3xl"
          modhash={wallet.modhash} />
      </div>
      <div className="w-4" />
      <h2 className="text-xl font-medium truncate">
        {wallet.name}
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
        <button className=""
          onMouseDown={copyBitcoinAddress.run}
          onClick={Events.cancel}>
          {copyBitcoinAddress.current
            ? "Copied"
            : Bitcoin.Address.format(wallet.bitcoinAddress)}
        </button>
      </div>
      <div className="flex justify-between items-center text-sm truncate">
        <div className="">
          Ethereum
        </div>
        <button className=""
          onMouseDown={copyEthereumAddress.run}
          onClick={Events.cancel}>
          {copyEthereumAddress.current
            ? "Copied"
            : Ethereum.Address.format(wallet.ethereumAddress)}
        </button>
      </div>
    </div>

  return <div className={`p-md w-full h-[216px] max-w-sm rounded-xl flex flex-col text-opposite bg-gradient-to-br ${fromColor} ${toColor}`}>
    <div className="grow truncate flex flex-col">
      {First}
      <div className="grow" />
      {Second}
    </div>
  </div>
}
