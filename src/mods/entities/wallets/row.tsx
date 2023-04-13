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
        <WalletIcon className=""
          modhash={wallet.modhash} />
      </div>
      <div className="w-2" />
      <h2 className="font-medium truncate">
        {wallet.name}
      </h2>
      <div className="w-2 grow" />
      <div className="text-opposite-high-contrast">
        $0
      </div>
    </div>

  const Second =
    <>
      <div className="flex justify-between items-center text-sm">
        <div className="">
          BTC
        </div>
        <button className="text-opposite-high-contrast"
          onMouseDown={Events.cancel}
          onClick={copyBitcoinAddress.run}>
          {copyBitcoinAddress.current
            ? "Copied"
            : Bitcoin.Address.format(wallet.bitcoinAddress)}
        </button>
      </div>
      <div className="flex justify-between items-center text-sm">
        <div className="">
          ETH
        </div>
        <button className="text-opposite-high-contrast"
          onMouseDown={Events.cancel}
          onClick={copyEthereumAddress.run}>
          {copyEthereumAddress.current
            ? "Copied"
            : Ethereum.Address.format(wallet.ethereumAddress)}
        </button>
      </div>
    </>

  return <div className={`p-md w-full aspect-video rounded-xl flex flex-col text-opposite bg-gradient-to-br ${fromColor} ${toColor}`}>
    {First}
    <div className="grow" />
    {Second}
  </div>
}
