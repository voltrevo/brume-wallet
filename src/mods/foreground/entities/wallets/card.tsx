import { Color, Gradient } from "@/libs/colors/colors"
import { useCopy } from "@/libs/copy/copy"
import { chainByChainId } from "@/libs/ethereum/mods/chain"
import { Outline } from "@/libs/icons/icons"
import { Events, useMouseCancel } from "@/libs/react/events"
import { ChildrenProps } from "@/libs/react/props/children"
import { AnchorProps, ButtonProps } from "@/libs/react/props/html"
import { State } from "@/libs/react/state"
import { Address, ZeroHexString } from "@hazae41/cubane"
import { Optional } from "@hazae41/option"
import { useCallback, useMemo, useState } from "react"
import { flushSync } from "react-dom"
import { useSubpath } from "../../router/path/context"
import { useEnsReverseNoFetch } from "../names/data"
import { useTotalWalletPricedBalance } from "../unknown/data"
import { useGenius } from "../users/all/page"
import { WalletIcon } from "./avatar"
import { useWalletDataContext } from "./context"
import { useEthereumContext } from "./data"
import { useCompactDisplayUsd } from "./page"

export function SimpleWalletDataCard(props: { index?: number } & { href?: string } & { $privateKey?: State<Optional<ZeroHexString>> }) {
  const wallet = useWalletDataContext().unwrap()
  const { index, href, $privateKey } = props

  return <SimpleWalletCard
    uuid={wallet.uuid}
    address={wallet.address}
    name={wallet.name}
    emoji={wallet.emoji}
    color={Color.get(wallet.color)}
    $privateKey={$privateKey}
    index={index}
    href={href} />
}

export function RawWalletDataCard(props: { index?: number } & { href?: string } & { $privateKey?: State<Optional<ZeroHexString>> }) {
  const wallet = useWalletDataContext().unwrap()
  const { index, href, $privateKey } = props

  return <RawWalletCard
    uuid={wallet.uuid}
    address={wallet.address}
    name={wallet.name}
    emoji={wallet.emoji}
    color={Color.get(wallet.color)}
    $privateKey={$privateKey}
    index={index}
    href={href} />
}

export function SimpleWalletCard(props: { uuid: string } & { name: string } & { emoji: string } & { color: Color } & { address: ZeroHexString } & { index?: number } & { href?: string } & { $privateKey?: State<Optional<ZeroHexString>> }) {
  return <div className="w-full aspect-video rounded-xl">
    <RawWalletCard {...props} />
  </div>
}

export function RawWalletCard(props: { uuid: string } & { name: string } & { emoji: string } & { color: Color } & { address: ZeroHexString } & { index?: number } & { href?: string } & { $privateKey?: State<Optional<ZeroHexString>> }) {
  const { uuid, address, name, emoji, color, index, href, $privateKey } = props
  const subpath = useSubpath()

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

  const [[privateKey, setPrivateKey] = []] = [$privateKey]
  const [privateKey2, setPrivateKey2] = useState<Optional<ZeroHexString>>()

  const onTransitionEnd = useCallback(() => {
    flushSync(() => setPrivateKey2?.(privateKey))
  }, [privateKey])

  const genius = useGenius(subpath, href)

  const First =
    <div className="flex items-center">
      <div className="shrink-0">
        <WalletIcon className="text-xl"
          emoji={emoji} />
      </div>
      <div className="w-2 grow" />
      {index == null && href != null &&
        <CircularWhiteAnchorInColoredCard
          onKeyDown={genius.onKeyDown}
          onClick={genius.onClick}
          href={genius.href}
          color={color}>
          <Outline.EllipsisHorizontalIcon className="size-4" />
        </CircularWhiteAnchorInColoredCard>}
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

  return <div className="w-full h-full"
    style={{ perspective: "1000px" }}>
    <div className={`relative z-10 w-full h-full text-white bg-gradient-to-br from-${color1}-400 to-${color2}-400 dark:from-${color1}-500 dark:to-${color2}-500 rounded-xl ${privateKey && !privateKey2 ? "animate-flip-in" : ""} ${!privateKey && privateKey2 ? "animate-flip-out" : ""}`}
      style={{ transform: privateKey && privateKey2 ? `rotateY(180deg)` : "", transformStyle: "preserve-3d" }}
      onAnimationEnd={onTransitionEnd}>
      <div className="po-md absolute w-full h-full flex flex-col"
        style={{ backfaceVisibility: "hidden" }}
        onContextMenu={genius.onContextMenu}>
        {First}
        <div className="grow" />
        {Name}
        {AddressDisplay}
      </div>
      <div className="po-md absolute w-full h-full flex flex-col"
        style={{ backfaceVisibility: "hidden", transform: `rotateY(180deg)` }}
        onContextMenu={genius.onContextMenu}>
        <div className="flex items-center">
          <div className="w-2 grow" />
          <CircularWhiteButtonInColoredCard
            onClick={() => setPrivateKey?.(undefined)}
            color={color}>
            <Outline.ArrowLeftIcon className="size-4" />
          </CircularWhiteButtonInColoredCard>
        </div>
        <div className="grow" />
        <div className="text-white">
          Private key
        </div>
        <div className="text-white-high-contrast break-all"
          onContextMenu={Events.keep}>
          {privateKey || privateKey2}
        </div>
      </div>
    </div>
  </div>
}

export function CircularWhiteAnchorInColoredCard(props: AnchorProps & ChildrenProps & { color: Color }) {
  const { children, color, "aria-disabled": disabled = false, ...rest } = props

  return <a className={`group p-1 bg-white text-${color}-400 dark:text-color-500 rounded-full outline-none aria-[disabled=false]:hover:bg-white/90 focus-visible:outline-white aria-disabled:opacity-50 transition-opacity`}
    aria-disabled={disabled}
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
      {children}
    </div>
  </a>
}

export function CircularWhiteButtonInColoredCard(props: ButtonProps & ChildrenProps & { color: Color }) {
  const { children, color, ...rest } = props

  return <button className={`group p-1 bg-white text-${color}-400 dark:text-color-500 rounded-full outline-none enabled:hover:bg-white/90 focus-visible:outline-white disabled:opacity-50 transition-opacity`}
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}