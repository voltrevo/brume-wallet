import { Colors } from "@/libs/colors/colors"
import { useCopy } from "@/libs/copy/copy"
import { Ethereum } from "@/libs/ethereum/ethereum"
import { useMouseCancel } from "@/libs/react/events"
import { useQuery } from "@hazae41/xswr"
import { WalletIcon } from "./avatar"
import { useWalletData } from "./context"
import { getTotalWalletPricedBalance } from "./data"
import { useDisplay } from "./page"

export function WalletDataCard() {
  const wallet = useWalletData()

  const color = Colors.get(wallet.color)
  const color2 = Colors.get(wallet.color + 1)

  const copyEthereumAddress = useCopy(wallet.address)
  const onClickCopyEthereumAddress = useMouseCancel(copyEthereumAddress.run)

  const totalBalanceQuery = useQuery(getTotalWalletPricedBalance, [wallet.address])
  const totalBalanceDisplay = useDisplay(totalBalanceQuery.current?.mapSync(x => x.move(3)))

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
        ${totalBalanceDisplay}
      </div>
    </div>

  const Second =
    <div className="flex justify-between items-center text-sm">
      <div className="">
        ETH
      </div>
      <div className="cursor-pointer text-opposite-high-contrast"
        onClick={onClickCopyEthereumAddress}>
        {copyEthereumAddress.current
          ? "Copied"
          : Ethereum.Address.format(wallet.address)}
      </div>
    </div>

  return <div className={`p-md w-full aspect-video rounded-xl flex flex-col text-opposite bg-gradient-to-br from-${color} to-${color2}`}>
    {First}
    <div className="grow" />
    {Second}
  </div>
}
