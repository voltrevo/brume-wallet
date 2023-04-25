import { Colors } from "@/libs/colors/colors"
import { useCopy } from "@/libs/copy/copy"
import { Ethereum } from "@/libs/ethereum/ethereum"
import { Events } from "@/libs/react/events"
import { WalletIcon } from "./avatar"
import { WalletDataProps } from "./data"

export function WalletCard(props: WalletDataProps) {
  const { wallet } = props

  const color = Colors.get(wallet.color)
  const color2 = Colors.get(wallet.color + 1)

  const copyEthereumAddress = useCopy(wallet.address)

  const First =
    <div className="flex items-center">
      <div className="shrink-0">
        <WalletIcon className=""
          emoji={wallet.emoji} />
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
    <div className="flex justify-between items-center text-sm">
      <div className="">
        ETH
      </div>
      <button className="text-opposite-high-contrast"
        onMouseDown={Events.cancel}
        onClick={copyEthereumAddress.run}>
        {copyEthereumAddress.current
          ? "Copied"
          : Ethereum.Address.format(wallet.address)}
      </button>
    </div>

  return <div className={`p-md w-full aspect-video rounded-xl flex flex-col text-opposite bg-gradient-to-br from-${color} to-${color2}`}>
    {First}
    <div className="grow" />
    {Second}
  </div>
}
