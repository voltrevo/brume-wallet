/* eslint-disable @next/next/no-img-element */
import { Fixed } from "@/libs/bigints/bigints";
import { Colors } from "@/libs/colors/colors";
import { chains, pairsByAddress, pairsByName } from "@/libs/ethereum/chain";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Option, Optional } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { PageHeader } from "../../components/page/header";
import { Page } from "../../components/page/page";
import { WalletDataProvider, useWalletData } from "./context";
import { useBalance, useEthereumHandle, usePairPrice } from "./data";
import { WalletDataCard } from "./row";
import { WalletDataSendDialog } from "./send";

export function WalletPage(props: UUIDProps) {
  const { uuid } = props

  return <WalletDataProvider uuid={uuid}>
    <WalletDataPage />
  </WalletDataProvider>
}

export function useDisplay(option: Optional<Result<Fixed, Error>>) {
  return useMemo(() => {
    return Option.wrap(option).mapSync(result => result.mapSync(fixed => {
      return Number(fixed.move(5).toString()).toLocaleString(undefined, {})
    }).mapErrSync(() => "Error").inner).unwrapOr("...")
  }, [option])
}

export function useDisplayUsd(option: Optional<Result<Fixed, Error>>) {
  return useMemo(() => {
    return Option.wrap(option).mapSync(result => result.mapSync(fixed => {
      return Number(fixed.toString()).toLocaleString(undefined, { style: "currency", currency: "USD" })
    }).mapErrSync(() => "Error").inner).unwrapOr("...")
  }, [option])
}

export function useCompactDisplayUsd(option: Optional<Result<Fixed, Error>>) {
  return useMemo(() => {
    return Option.wrap(option).mapSync(result => result.mapSync(fixed => {
      return Number(fixed.toString()).toLocaleString(undefined, { style: "currency", currency: "USD", notation: "compact" })
    }).mapErrSync(() => "Error").inner).unwrapOr("...")
  }, [option])
}

function useProduct(option: Optional<Result<Fixed[], Error>>) {
  return useMemo(() => {
    return Option.mapSync(option, result => result.mapSync(fixeds => fixeds.reduce((x, y) => y.mul(x), new Fixed(1n, 0))))
  }, [option])
}

function useMerge<T, E>(...results: Optional<Result<T, E>>[]) {
  return useMemo(() => {
    return Result.maybeAll(results)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...results])
}

function WalletDataPage() {
  const wallet = useWalletData()

  const router = useRouter()

  const mainnet = useEthereumHandle(wallet, chains[1])
  const goerli = useEthereumHandle(wallet, chains[5])
  const polygon = useEthereumHandle(wallet, chains[137])

  const color = Colors.get(wallet.color)
  const color2 = Colors.get(wallet.color + 1)

  const mainnetBalanceQuery = useBalance(wallet.address, mainnet)
  const mainnetBalanceFixed = mainnetBalanceQuery.current?.mapSync(x => new Fixed(x, 18))
  const mainnetBalanceDisplay = useDisplay(mainnetBalanceFixed)
  const mainnetSendDialog = useBooleanHandle(false)

  const goerliBalance = useBalance(wallet.address, goerli)
  const goerliBalanceFixed = goerliBalance.current?.mapSync(x => new Fixed(x, 18))
  const goerliBalanceDisplay = useDisplay(goerliBalanceFixed)
  const goerliSendDialog = useBooleanHandle(false)

  const polygonBalanceQuery = useBalance(wallet.address, polygon)
  const polygonBalanceFixed = polygonBalanceQuery.current?.mapSync(x => new Fixed(x, 18))
  const polygonBalanceDisplay = useDisplay(polygonBalanceFixed)
  const polygonSendDialog = useBooleanHandle(false)

  const wethUsdPriceFixed = usePairPrice(pairsByAddress[pairsByName.WETH_USDT], mainnet)
  const maticWethPriceFixed = usePairPrice(pairsByAddress[pairsByName.MATIC_WETH], mainnet)

  const ethBalanceUsdBigint = useProduct(useMerge(mainnetBalanceFixed, wethUsdPriceFixed.current))
  const ethBalanceUsdDisplay = useDisplayUsd(ethBalanceUsdBigint)

  const goerliBalanceUsdDisplay = useDisplayUsd(new Ok(new Fixed(0n, 0)))

  const maticBalanceUsdBigint = useProduct(useMerge(polygonBalanceFixed, maticWethPriceFixed.current, wethUsdPriceFixed.current))
  const maticBalanceUsdDisplay = useDisplayUsd(maticBalanceUsdBigint)

  const Header =
    <PageHeader
      title="Wallet"
      back={router.back} />

  const Card =
    <div className="p-xmd flex justify-center">
      <div className="w-full max-w-sm">
        <WalletDataCard />
      </div>
    </div>

  const Apps =
    <div className="p-xmd flex items-center justify-center flex-wrap gap-12">
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 hovered-or-active-or-selected:scale-105 transition-transform`}
          onClick={mainnetSendDialog.enable}>
          <Outline.PaperAirplaneIcon className="icon-md" />
        </button>
        <div className="">
          {`Send`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 hovered-or-active-or-selected:scale-105 transition-transform`}>
          <Outline.QrCodeIcon className="icon-md" />
        </button>
        <div className="">
          {`Receive`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 hovered-or-active-or-selected:scale-105 transition-transform`}>
          <Outline.ArrowsRightLeftIcon className="icon-md" />
        </button>
        <div className="">
          {`Swap`}
        </div>
      </div>
    </div>

  return <Page>
    {mainnetSendDialog.current && mainnet &&
      <WalletDataSendDialog title="(Ethereum mainnet)"
        handle={mainnet}
        close={mainnetSendDialog.disable} />}
    {goerliSendDialog.current && goerli &&
      <WalletDataSendDialog title="(Goerli testnet)"
        handle={goerli}
        close={goerliSendDialog.disable} />}
    {polygonSendDialog.current && polygon &&
      <WalletDataSendDialog title="(Polygon mainnet)"
        handle={polygon}
        close={polygonSendDialog.disable} />}
    {Header}
    {Card}
    {Apps}
    <div className="p-xmd flex flex-col gap-2">
      <button className="w-full p-xmd flex flex-col rounded-xl border border-contrast"
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
      <button className="w-full p-xmd flex flex-col rounded-xl border border-contrast"
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
      <button className="w-full p-xmd flex flex-col rounded-xl border border-contrast"
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
    </div>
  </Page>
}
