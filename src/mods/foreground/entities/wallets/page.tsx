/* eslint-disable @next/next/no-img-element */
import { Fixed, FixedInit } from "@/libs/bigints/bigints";
import { Gradients } from "@/libs/colors/colors";
import { EthereumChain, chains, pairsByAddress, pairsByName } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Option, Optional } from "@hazae41/option";
import { Result } from "@hazae41/result";
import { Data } from "@hazae41/xswr";
import { useCallback, useMemo } from "react";
import { PageBody, PageHeader } from "../../components/page/header";
import { Page } from "../../components/page/page";
import { Path } from "../../router/path";
import { WalletDataCard } from "./card";
import { WalletDataProvider, useWalletData } from "./context";
import { useEthereumContext, usePairPrice, usePendingBalance, usePricedBalance } from "./data";
import { WalletDataSendDialog } from "./send";

export function WalletPage(props: UUIDProps) {
  const { uuid } = props

  return <WalletDataProvider uuid={uuid}>
    <WalletDataPage />
  </WalletDataProvider>
}

export function useDisplay(option: Optional<Result<FixedInit, Error>>) {
  return useMemo(() => {
    return Option.wrap(option).mapSync(result => result.mapSync(fixed => {
      return Number(Fixed.from(fixed).move(5).toString()).toLocaleString(undefined)
    }).mapErrSync(() => "Error").inner).unwrapOr("...")
  }, [option])
}

export function useDisplayUsd(option: Optional<Result<FixedInit, Error>>) {
  return useMemo(() => {
    return Option.wrap(option).mapSync(result => result.mapSync(fixed => {
      return Number(Fixed.from(fixed).move(2).toString()).toLocaleString(undefined, { style: "currency", currency: "USD" })
    }).mapErrSync(() => "Error").inner).unwrapOr("...")
  }, [option])
}

export function useCompactDisplayUsd(option: Optional<Result<FixedInit, Error>>) {
  return useMemo(() => {
    return Option.wrap(option).mapSync(result => result.mapSync(fixed => {
      return Number(Fixed.from(fixed).move(2).toString()).toLocaleString(undefined, { style: "currency", currency: "USD", notation: "compact" })
    }).mapErrSync(() => "Error").inner).unwrapOr("??")
  }, [option])
}

function TokenRow(props: {
  chain: EthereumChain,
  prices: Optional<Data<FixedInit>>[]
}) {
  const { chain, prices } = props
  const wallet = useWalletData()

  const context = useEthereumContext(wallet, chain)

  const balanceQuery = usePendingBalance(wallet.address, context, ...prices)
  const balanceDisplay = useDisplay(balanceQuery.current)

  const sendDialog = useBooleanHandle(false)

  const balanceUsdFixed = usePricedBalance(context, wallet.address, "usd")
  const balanceUsdDisplay = useDisplayUsd(balanceUsdFixed.current)

  return <>
    {sendDialog.current && context &&
      <WalletDataSendDialog
        title={`${chain.token.symbol} on ${chain.name}`}
        context={context}
        close={sendDialog.disable} />}
    <button className="w-full p-4 flex flex-col rounded-xl bg-contrast"
      onClick={sendDialog.enable}>
      <div className="w-full flex justify-between items-center">
        <div className="">
          {chain.name}
        </div>
        <div className="">
          {balanceUsdDisplay}
        </div>
      </div>
      <div className="text-contrast">
        {`${balanceDisplay} ${chain.token.symbol}`}
      </div>
    </button>
  </>
}

function WalletDataPage() {
  const wallet = useWalletData()

  const mainnet = useEthereumContext(wallet, chains[1])
  const mainnetSendDialog = useBooleanHandle(false)

  const [color, color2] = Gradients.get(wallet.color)

  const wethUsdPriceQuery = usePairPrice(mainnet, pairsByAddress[pairsByName.WETH_USDT])
  const maticWethPriceQuery = usePairPrice(mainnet, pairsByAddress[pairsByName.MATIC_WETH])

  const onBackClick = useCallback(() => {
    Path.go("/wallets")
  }, [])

  const Header =
    <PageHeader
      title="Wallet"
      back={onBackClick} />

  const Card =
    <div className="p-4 flex justify-center">
      <div className="w-full max-w-sm">
        <WalletDataCard />
      </div>
    </div>

  const Apps =
    <div className="p-4 flex items-center justify-center flex-wrap gap-12">
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 hovered-or-clicked-or-focused:scale-105 transition-transform`}
          onClick={mainnetSendDialog.enable}>
          <Outline.PaperAirplaneIcon className="s-md" />
        </button>
        <div className="">
          {`Send`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 hovered-or-clicked-or-focused:scale-105 transition-transform`}>
          <Outline.QrCodeIcon className="s-md" />
        </button>
        <div className="">
          {`Receive`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 hovered-or-clicked-or-focused:scale-105 transition-transform`}>
          <Outline.ArrowsRightLeftIcon className="s-md" />
        </button>
        <div className="">
          {`Swap`}
        </div>
      </div>
    </div>

  const Body =
    <PageBody>
      <div className="flex flex-col gap-2">
        <TokenRow
          chain={chains[1]}
          prices={[wethUsdPriceQuery.data]} />
        <TokenRow
          chain={chains[5]}
          prices={[]} />
        <TokenRow
          chain={chains[10]}
          prices={[wethUsdPriceQuery.data]} />
        <TokenRow
          chain={chains[137]}
          prices={[wethUsdPriceQuery.data, maticWethPriceQuery.data]} />
        <TokenRow
          chain={chains[42161]}
          prices={[wethUsdPriceQuery.data]} />
        <TokenRow
          chain={chains[43114]}
          prices={[wethUsdPriceQuery.data]} />
        <TokenRow
          chain={chains[11155111]}
          prices={[]} />
      </div>
    </PageBody>

  return <Page>
    {mainnetSendDialog.current && mainnet &&
      <WalletDataSendDialog title="ETH on Ethereum"
        context={mainnet}
        close={mainnetSendDialog.disable} />}
    {Header}
    {Card}
    {Apps}
    {Body}
  </Page>
}
