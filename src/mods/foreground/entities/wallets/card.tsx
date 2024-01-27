import { Color, Gradient } from "@/libs/colors/colors"
import { useCopy } from "@/libs/copy/copy"
import { chainByChainId } from "@/libs/ethereum/mods/chain"
import { Outline } from "@/libs/icons/icons"
import { useMouseCancel } from "@/libs/react/events"
import { ChildrenProps } from "@/libs/react/props/children"
import { ButtonProps } from "@/libs/react/props/html"
import { Button } from "@/libs/ui/button"
import { Address, ZeroHexString } from "@hazae41/cubane"
import { useMemo } from "react"
import { useEnsReverseNoFetch } from "../names/data"
import { useTotalWalletPricedBalance } from "../unknown/data"
import { WalletIcon } from "./avatar"
import { useWalletDataContext } from "./context"
import { useEthereumContext } from "./data"
import { useCompactDisplayUsd } from "./page"

export function SimpleWalletDataCard(props: { index?: number }) {
  const wallet = useWalletDataContext().unwrap()
  const { index } = props

  return <SimpleWalletCard
    uuid={wallet.uuid}
    address={wallet.address}
    name={wallet.name}
    emoji={wallet.emoji}
    color={Color.get(wallet.color)}
    index={index} />
}

export function RawWalletDataCard(props: { index?: number }) {
  const wallet = useWalletDataContext().unwrap()
  const { index } = props

  return <RawWalletCard
    uuid={wallet.uuid}
    address={wallet.address}
    name={wallet.name}
    emoji={wallet.emoji}
    color={Color.get(wallet.color)}
    index={index} />
}

export function SimpleWalletCard(props: { uuid: string } & { name: string } & { emoji: string } & { color: Color } & { address: ZeroHexString } & { index?: number }) {
  return <div className="w-full aspect-video rounded-xl overflow-hidden">
    <RawWalletCard {...props} />
  </div>
}

export function RawWalletCard(props: { uuid: string } & { name: string } & { emoji: string } & { color: Color } & { address: ZeroHexString } & { index?: number } & { ok?: () => void }) {
  const { uuid, address, name, emoji, color, index, ok } = props

  const [color1, color2] = Gradient.get(color)

  const finalAddress = useMemo(() => {
    return Address.fromOrThrow(address)
  }, [address])

  const addressDisplay = useMemo(() => {
    return Address.format(finalAddress)
  }, [finalAddress])

  const mainnet = useEthereumContext(uuid, chainByChainId[1])
  const ens = useEnsReverseNoFetch(finalAddress, mainnet)

  const ensOrFinalAddress = ens.data?.get() ?? finalAddress
  const ensOrAddressDisplay = ens.data?.get() ?? addressDisplay

  const copyEthereumAddress = useCopy(ensOrFinalAddress)
  const onClickCopyEthereumAddress = useMouseCancel(copyEthereumAddress.run)

  const totalBalanceQuery = useTotalWalletPricedBalance(finalAddress, "usd")
  const totalBalanceDisplay = useCompactDisplayUsd(totalBalanceQuery.current)

  const First =
    <div className="flex items-center">
      <div className="shrink-0">
        <WalletIcon className="text-xl"
          emoji={emoji} />
      </div>
      <div className="w-2 grow" />
      {index == null && ok != null &&
        <CircularWhiteButtonInColoredCard
          color={color}
          onClick={ok}>
          <Outline.EllipsisHorizontalIcon className="size-5" />
        </CircularWhiteButtonInColoredCard>}
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
        {name}
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

  return <div className={`po-md w-full h-full flex flex-col text-white bg-gradient-to-br from-${color1}-400 to-${color2}-400 dark:from-${color1}-500 dark:to-${color2}-500`}>
    {First}
    <div className="grow" />
    {Name}
    {AddressDisplay}
  </div>
}

export function CircularWhiteButtonInColoredCard(props: ButtonProps & ChildrenProps & { color: Color }) {
  const { children, color } = props

  return <button className={`group bg-white text-${color}-400 dark:text-color-500 rounded-full outline-none hover:bg-white/90 focus-visible:outline-white  disabled:opacity-50  transition-opacity`}>
    <div className={`${Button.Shrinker.className}`}>
      {children}
    </div>
  </button>
}