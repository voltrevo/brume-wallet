import { Gradients } from "@/libs/colors/colors"
import { useCopy } from "@/libs/copy/copy"
import { chainByChainId } from "@/libs/ethereum/mods/chain"
import { Outline } from "@/libs/icons/icons"
import { useMouseCancel } from "@/libs/react/events"
import { Button } from "@/libs/ui/button"
import { Address } from "@hazae41/cubane"
import { useMemo } from "react"
import { useEnsReverseNoFetch } from "../names/data"
import { useTotalWalletPricedBalance } from "../unknown/data"
import { WalletIcon } from "./avatar"
import { useWalletDataContext } from "./context"
import { useEthereumContext } from "./data"
import { useCompactDisplayUsd } from "./page"

export function SimpleWalletDataCard() {
  return <div className="w-full aspect-video rounded-xl overflow-hidden">
    <WalletDataCard />
  </div>
}

export function WalletDataCard(props: { index?: number }) {
  const wallet = useWalletDataContext().unwrap()
  const { index } = props

  const mainnet = useEthereumContext(wallet.uuid, chainByChainId[1])
  const ens = useEnsReverseNoFetch(wallet.address, mainnet)

  const [color, color2] = Gradients.get(wallet.color)

  const onClickEllipsis = useMouseCancel(() => alert("This feature is not implemented yet"), [])

  const address = useMemo(() => {
    return Address.from(wallet.address)!
  }, [wallet.address])

  const ensOrAddress = ens.data?.inner ?? address
  const ensOrAddressDisplay = ens.data?.inner ?? Address.format(address)

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
      {index == null &&
        <button className={`${Button.Base.className} ${Button.White.className} text-${color}`}
          onClick={onClickEllipsis}>
          <div className={`${Button.Shrinker.className}`}>
            <Outline.EllipsisHorizontalIcon className="size-5" />
          </div>
        </button>}
      {index != null && index !== -1 &&
        <div className={`border-2 border-white flex items-center justify-center rounded-full overflow-hidden`}>
          <div className={`bg-blue-600 flex items-center justify-center size-5 text-white font-medium`}>
            {index + 1}
          </div>
        </div>}
      {index != null && index === -1 &&
        <div className={`border-2 border-contrast flex items-center justify-center rounded-full`}>
          <div className="size-5" />
        </div>}
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

  const AddressDisplay =
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

  return <div className={`po-md w-full h-full flex flex-col text-white bg-gradient-to-br from-${color} to-${color2}`}>
    {First}
    <div className="grow" />
    {Name}
    {AddressDisplay}
  </div>
}
