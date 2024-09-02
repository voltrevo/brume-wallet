import { Color } from "@/libs/colors/colors"
import { useCopy } from "@/libs/copy/copy"
import { chainDataByChainId } from "@/libs/ethereum/mods/chain"
import { Outline } from "@/libs/icons/icons"
import { Events, useMouseCancel } from "@/libs/react/events"
import { ChildrenProps } from "@/libs/react/props/children"
import { AnchorProps, ButtonProps } from "@/libs/react/props/html"
import { ButtonShrinkerDiv } from "@/libs/ui/shrinker"
import { getWalletEmoji, WalletData } from "@/mods/background/service_worker/entities/wallets/data"
import { useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin"
import { Address, ZeroHexString } from "@hazae41/cubane"
import { useCallback, useEffect, useMemo, useState } from "react"
import { flushSync } from "react-dom"
import { useEnsReverseNoFetch } from "../names/data"
import { useTotalWalletPricedBalance } from "../unknown/data"
import { useWalletDataContext } from "./context"
import { useEthereumContext } from "./data"
import { useCompactDisplayUsdOrZeroOrError } from "./page"

export function RawWalletDataCard(props: { index?: number } & { href?: string } & { privateKey?: string } & { flip?: boolean } & { unflip?: () => void }) {
  const wallet = useWalletDataContext().getOrThrow()
  const { index, href, privateKey, flip, unflip } = props

  return <RawWalletCard
    type={wallet.type}
    uuid={wallet.uuid}
    address={wallet.address}
    name={wallet.name}
    color={Color.get(wallet.color)}
    privateKey={privateKey}
    flip={flip}
    unflip={unflip}
    index={index}
    href={href} />
}

export function RawWalletCard(props: { type?: WalletData["type"] } & { uuid: string } & { name: string } & { color: Color } & { address: ZeroHexString } & { index?: number } & { href?: string } & { privateKey?: string } & { flip?: boolean } & { unflip?: () => void }) {
  const path = usePathContext().getOrThrow()
  const { type, uuid, address, name, color, index, href, privateKey, flip, unflip } = props

  const subpath = useHashSubpath(path)
  const genius = useCoords(subpath, href)

  const finalAddress = useMemo(() => {
    return Address.fromOrThrow(address)
  }, [address])

  const addressDisplay = useMemo(() => {
    return Address.format(finalAddress)
  }, [finalAddress])

  const mainnet = useEthereumContext(uuid, chainDataByChainId[1])
  const ens = useEnsReverseNoFetch(finalAddress, mainnet)

  const ensOrFinalAddress = ens.data?.get() ?? finalAddress
  const ensOrAddressDisplay = ens.data?.get() ?? addressDisplay

  const copyEthereumAddress = useCopy(ensOrFinalAddress)
  const onClickCopyEthereumAddress = useMouseCancel(copyEthereumAddress.run)

  const totalBalanceQuery = useTotalWalletPricedBalance(finalAddress, "usd")
  const totalBalanceDisplay = useCompactDisplayUsdOrZeroOrError(totalBalanceQuery.current)

  const [preflip = false, setPreflip] = useState(flip)
  const [postflip, setPostflip] = useState(false)

  const onAnimationEnd = useCallback(() => {
    flushSync(() => setPostflip(preflip))
  }, [preflip])

  useEffect(() => {
    setPreflip(flip)
  }, [flip])

  useEffect(() => {
    if (preflip)
      return
    if (postflip)
      return
    unflip?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preflip, postflip])

  const First =
    <div className="flex items-center">
      <div className="flex-none text-xl">
        {type && getWalletEmoji(type)}
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

  return <div className="w-full h-full [perspective:1000px]">
    <div className={`relative z-10 w-full h-full text-white bg-${color}-400 dark:bg-${color}-500 rounded-xl ${preflip && !postflip ? "animate-flip-in" : ""} ${!preflip && postflip ? "animate-flip-out" : ""}`}
      style={{ transform: preflip && postflip ? `rotateY(180deg)` : "", transformStyle: "preserve-3d" }}
      onAnimationEnd={onAnimationEnd}>
      <div className="po-md absolute w-full h-full flex flex-col [backface-visibility:hidden]"
        onContextMenu={genius.onContextMenu}>
        {First}
        <div className="grow" />
        {Name}
        {AddressDisplay}
      </div>
      <div className="po-md absolute w-full h-full flex flex-col [backface-visibility:hidden] [transform:rotateY(180deg)]"
        onContextMenu={genius.onContextMenu}>
        <div className="flex items-center">
          <div className="w-2 grow" />
          <CircularWhiteButtonInColoredCard
            onClick={() => setPreflip?.(false)}
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
          {privateKey}
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
    <ButtonShrinkerDiv>
      {children}
    </ButtonShrinkerDiv>
  </button>
}