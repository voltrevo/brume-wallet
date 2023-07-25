/* eslint-disable @next/next/no-img-element */
import { Fixed, FixedInit } from "@/libs/bigints/bigints";
import { Gradients } from "@/libs/colors/colors";
import { chains, pairsByAddress, pairsByName } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Option, Optional } from "@hazae41/option";
import { Result } from "@hazae41/result";
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

function WalletDataPage() {
  const wallet = useWalletData()

  const mainnet = useEthereumContext(wallet, chains[1])
  const polygon = useEthereumContext(wallet, chains[137])
  const goerli = useEthereumContext(wallet, chains[5])
  const sepolia = useEthereumContext(wallet, chains[11155111])

  const [color, color2] = Gradients.get(wallet.color)

  const wethUsdPriceQuery = usePairPrice(mainnet, pairsByAddress[pairsByName.WETH_USDT])
  const maticWethPriceQuery = usePairPrice(mainnet, pairsByAddress[pairsByName.MATIC_WETH])

  const mainnetBalanceQuery = usePendingBalance(wallet.address, mainnet, wethUsdPriceQuery.data)
  const mainnetBalanceDisplay = useDisplay(mainnetBalanceQuery.current)
  const mainnetSendDialog = useBooleanHandle(false)

  const ethBalanceUsdBigint = usePricedBalance(mainnet, wallet.address, "usd")
  const ethBalanceUsdDisplay = useDisplayUsd(ethBalanceUsdBigint.current)

  const polygonBalanceQuery = usePendingBalance(wallet.address, polygon, wethUsdPriceQuery.data, maticWethPriceQuery.data)
  const polygonBalanceDisplay = useDisplay(polygonBalanceQuery.current)
  const polygonSendDialog = useBooleanHandle(false)

  const maticBalanceUsdBigint = usePricedBalance(polygon, wallet.address, "usd")
  const maticBalanceUsdDisplay = useDisplayUsd(maticBalanceUsdBigint.current)

  const goerliBalance = usePendingBalance(wallet.address, goerli)
  const goerliBalanceDisplay = useDisplay(goerliBalance.current)
  const goerliSendDialog = useBooleanHandle(false)

  const goerliBalanceUsdBigint = usePricedBalance(goerli, wallet.address, "usd")
  const goerliBalanceUsdDisplay = useDisplayUsd(goerliBalanceUsdBigint.current)

  const sepoliaBalance = usePendingBalance(wallet.address, sepolia)
  const sepoliaBalanceDisplay = useDisplay(sepoliaBalance.current)
  const sepoliaSendDialog = useBooleanHandle(false)

  const sepoliaBalanceUsdBigint = usePricedBalance(sepolia, wallet.address, "usd")
  const sepoliaBalanceUsdDisplay = useDisplayUsd(sepoliaBalanceUsdBigint.current)

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
        <button className="w-full p-4 flex flex-col rounded-xl bg-contrast"
          onClick={mainnetSendDialog.enable}>
          <div className="w-full flex justify-between items-center">
            <div className="">
              Ethereum
            </div>
            <div className="">
              {ethBalanceUsdDisplay}
            </div>
          </div>
          <div className="text-contrast">
            {`${mainnetBalanceDisplay} ETH`}
          </div>
        </button>
        <button className="w-full p-4 flex flex-col rounded-xl bg-contrast"
          onClick={polygonSendDialog.enable}>
          <div className="w-full flex justify-between items-center">
            <div className="">
              Polygon
            </div>
            <div className="">
              {maticBalanceUsdDisplay}
            </div>
          </div>
          <div className="text-contrast">
            {`${polygonBalanceDisplay} MATIC`}
          </div>
        </button>
        <button className="w-full p-4 flex flex-col rounded-xl bg-contrast"
          onClick={goerliSendDialog.enable}>
          <div className="w-full flex justify-between items-center">
            <div className="">
              Goerli
            </div>
            <div className="">
              {goerliBalanceUsdDisplay}
            </div>
          </div>
          <div className="text-contrast">
            {`${goerliBalanceDisplay} ETH`}
          </div>
        </button>
        <button className="w-full p-4 flex flex-col rounded-xl bg-contrast"
          onClick={sepoliaSendDialog.enable}>
          <div className="w-full flex justify-between items-center">
            <div className="">
              Sepolia
            </div>
            <div className="">
              {sepoliaBalanceUsdDisplay}
            </div>
          </div>
          <div className="text-contrast">
            {`${sepoliaBalanceDisplay} ETH`}
          </div>
        </button>
      </div>
    </PageBody>

  return <Page>
    {mainnetSendDialog.current && mainnet &&
      <WalletDataSendDialog title="(Ethereum)"
        context={mainnet}
        close={mainnetSendDialog.disable} />}
    {polygonSendDialog.current && polygon &&
      <WalletDataSendDialog title="(Polygon)"
        context={polygon}
        close={polygonSendDialog.disable} />}
    {goerliSendDialog.current && goerli &&
      <WalletDataSendDialog title="(Goerli)"
        context={goerli}
        close={goerliSendDialog.disable} />}
    {sepoliaSendDialog.current && sepolia &&
      <WalletDataSendDialog title="(Sepolia)"
        context={sepolia}
        close={sepoliaSendDialog.disable} />}
    {Header}
    {Card}
    {Apps}
    {Body}
  </Page>
}
