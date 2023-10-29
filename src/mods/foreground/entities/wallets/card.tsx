import { Gradients } from "@/libs/colors/colors"
import { useCopy } from "@/libs/copy/copy"
import { Ethereum } from "@/libs/ethereum"
import { chainByChainId } from "@/libs/ethereum/mods/chain"
import { Outline } from "@/libs/icons/icons"
import { useMouseCancel } from "@/libs/react/events"
import { Button } from "@/libs/ui/button"
import { WalletIcon } from "./avatar"
import { useWalletDataContext } from "./context"
import { useEnsReverseNoFetch, useEthereumContext, useTotalWalletPricedBalance } from "./data"
import { useCompactDisplayUsd } from "./page"

export function WalletDataCard() {
  const wallet = useWalletDataContext()

  const mainnet = useEthereumContext(wallet.uuid, chainByChainId[1])
  const ens = useEnsReverseNoFetch(wallet.address, mainnet)

  const [color, color2] = Gradients.get(wallet.color)

  const onClickEllipsis = useMouseCancel(() => alert("This feature is not implemented yet"), [])

  const ensOrAddress = ens.data?.inner ?? wallet.address
  const ensOrAddressDisplay = ens.data?.inner ?? Ethereum.Address.format(wallet.address)

  const copyEthereumAddress = useCopy(ensOrAddress)
  const onClickCopyEthereumAddress = useMouseCancel(copyEthereumAddress.run)

  const totalBalanceQuery = useTotalWalletPricedBalance(wallet.address, "usd")
  const totalBalanceDisplay = useCompactDisplayUsd(totalBalanceQuery.current)

  const First =
    <div className="flex items-center">
      <div className="shrink-0">
        <WalletIcon className="text-xl"
          emoji={wallet.emoji} />
      </div>
      <div className="w-2 grow" />
      <Button.White className={`text-${color}`}
        onClick={onClickEllipsis}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.EllipsisHorizontalIcon className="s-sm" />
        </div>
      </Button.White>
    </div>

  const Name =
    <div className="flex items-center text-white font-medium">
      <div className="truncate">
        {wallet.name}
      </div>
      <div className="w-2 grow" />
      <div className="font-base text-white-high-contrast">
        {totalBalanceDisplay}
      </div>
    </div>

  const Address =
    <div className="flex justify-between items-center text-sm">
      <div className="text-white-high-contrast">
        ETH
      </div>
      <div className="cursor-pointer text-white-high-contrast"
        onClick={onClickCopyEthereumAddress}>
        {copyEthereumAddress.current
          ? "Copied"
          : ensOrAddressDisplay}
      </div>
    </div>

  return <div className={`po-md w-full aspect-video rounded-xl flex flex-col text-white bg-gradient-to-br from-${color} to-${color2}`}>
    {First}
    <div className="grow" />
    {Name}
    {Address}
  </div>
}
