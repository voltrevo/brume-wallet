/* eslint-disable @next/next/no-img-element */
import { Fixed, FixedInit } from "@/libs/bigints/bigints";
import { Gradients } from "@/libs/colors/colors";
import { UIError } from "@/libs/errors/errors";
import { ContractTokenInfo, EthereumChain, chainByChainId, chainIdByName, pairByAddress, pairByName, tokenByAddress, tokenById } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Url } from "@/libs/url/url";
import { Wc, WcMetadata } from "@/libs/wconn/mods/wc/wc";
import { Option, Optional } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { useCallback, useMemo } from "react";
import { useBackground } from "../../background/context";
import { PageBody, PageHeader } from "../../components/page/header";
import { Page } from "../../components/page/page";
import { Path } from "../../router/path";
import { WalletDataReceiveDialog } from "./actions/receive/receive";
import { WalletDataSendContractTokenDialog } from "./actions/send/contract";
import { WalletDataSendNativeTokenDialog } from "./actions/send/native";
import { WalletDataCard } from "./card";
import { WalletDataProvider, useWalletData } from "./context";
import { useBalance, useEthereumContext, usePairPrice, usePricedBalance, useTokenBalance, useTokenPricedBalance } from "./data";

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

function NativeTokenRow(props: {
  chain: EthereumChain,
  prices: Optional<FixedInit>[]
}) {
  const { chain, prices } = props
  const wallet = useWalletData()

  const context = useEthereumContext(wallet, chain)

  const balanceQuery = useBalance(wallet.address, context, prices)
  const balanceDisplay = useDisplay(balanceQuery.current)

  const sendDialog = useBooleanHandle(false)

  const balanceUsdFixed = usePricedBalance(context, wallet.address, "usd")
  const balanceUsdDisplay = useDisplayUsd(balanceUsdFixed.current)

  return <>
    {sendDialog.current && context &&
      <WalletDataSendNativeTokenDialog
        title={`${chain.token.name} on ${chain.name}`}
        context={context}
        close={sendDialog.disable} />}
    <button className="w-full p-4 rounded-xl bg-contrast"
      onClick={sendDialog.enable}>
      <div className="w-full flex justify-between items-center">
        <div className="">
          {chain.token.name}
        </div>
        <div className="">
          {balanceUsdDisplay}
        </div>
      </div>
      <div className="text-left text-contrast">
        {`${balanceDisplay} ${chain.token.symbol}`}
      </div>
    </button>
  </>
}

function ContractTokenRow(props: {
  token: ContractTokenInfo,
  prices: Optional<FixedInit>[]
}) {
  const { token, prices } = props
  const chain = chainByChainId[token.chainId]
  const wallet = useWalletData()

  const context = useEthereumContext(wallet, chain)

  const balanceQuery = useTokenBalance(wallet.address, token, context, prices)
  const balanceDisplay = useDisplay(balanceQuery.current)

  const sendDialog = useBooleanHandle(false)

  const balanceUsdFixed = useTokenPricedBalance(context, wallet.address, token, "usd")
  const balanceUsdDisplay = useDisplayUsd(balanceUsdFixed.current)

  return <>
    {sendDialog.current && context &&
      <WalletDataSendContractTokenDialog
        title={`${token.name} on ${chain.name}`}
        context={context}
        token={token}
        close={sendDialog.disable} />}
    <button className="w-full p-4 rounded-xl bg-contrast"
      onClick={sendDialog.enable}>
      <div className="w-full flex justify-between items-center">
        <div className="">
          {token.name}
        </div>
        <div className="">
          {balanceUsdDisplay}
        </div>
      </div>
      <div className="text-left text-contrast">
        {`${balanceDisplay} ${token.symbol}`}
      </div>
    </button>
  </>
}

function WalletDataPage() {
  const wallet = useWalletData()
  const background = useBackground().unwrap()

  const mainnet = useEthereumContext(wallet, chainByChainId[chainIdByName.ETHEREUM])
  const binance = useEthereumContext(wallet, chainByChainId[chainIdByName.BINANCE])
  const celo = useEthereumContext(wallet, chainByChainId[chainIdByName.CELO])

  const sendDialog = useBooleanHandle(false)
  const receiveDialog = useBooleanHandle(false)

  const [color, color2] = Gradients.get(wallet.color)

  const wethUsdtPriceQuery = usePairPrice(mainnet, pairByAddress[pairByName.WETH_USDT])
  const maticWethPriceQuery = usePairPrice(mainnet, pairByAddress[pairByName.MATIC_WETH])
  const busdtWbnbPriceQuery = usePairPrice(binance, pairByAddress[pairByName.BUSDT_WBNB])
  const wbtcWethPriceQuery = usePairPrice(mainnet, pairByAddress[pairByName.WBTC_WETH])
  const etcBusdPriceQuery = usePairPrice(binance, pairByAddress[pairByName.ETC_BUSD])
  const celoMcusdPriceQuery = usePairPrice(celo, pairByAddress[pairByName.CELO_MCUSD])

  const onBackClick = useCallback(() => {
    Path.go("/wallets")
  }, [])

  const onCameraClick = useCallback(() => {
    Path.go(`/wallet/${wallet.uuid}/camera`)
  }, [wallet])

  const onLinkClick = useCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const clipboard = await navigator.clipboard.readText()

      const url = Url.tryParse(clipboard).setErr(new UIError("You must copy a WalletConnect link")).throw(t)
      await Wc.tryParse(url).then(r => r.setErr(new UIError("You must copy a WalletConnect link")).throw(t))

      alert(`Connecting...`)

      const metadata = await background.tryRequest<WcMetadata>({
        method: "brume_wc_connect",
        params: [clipboard, wallet.uuid]
      }).then(r => r.throw(t).throw(t))

      alert(`Connected to ${metadata.name}`)

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [wallet, background])

  const Header =
    <PageHeader
      title="Wallet"
      back={onBackClick}>
      <div className="flex gap-2">
        <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
          onClick={onCameraClick}>
          <Button.Shrink>
            <Outline.QrCodeIcon className="s-sm" />
          </Button.Shrink>
        </Button.Naked>
        <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
          onClick={onLinkClick}>
          <Button.Shrink>
            <Outline.LinkIcon className="s-sm" />
          </Button.Shrink>
        </Button.Naked>
      </div>
    </PageHeader>

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
          onClick={sendDialog.enable}>
          <Outline.PaperAirplaneIcon className="s-md" />
        </button>
        <div className="">
          {`Send`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 hovered-or-clicked-or-focused:scale-105 transition-transform`}
          onClick={receiveDialog.enable}>
          <Outline.QrCodeIcon className="s-md" />
        </button>
        <div className="">
          {`Receive`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 hovered-or-clicked-or-focused:scale-105 transition-transform`}
          onClick={() => alert("This feature is not implemented yet")}>
          <Outline.ArrowsRightLeftIcon className="s-md" />
        </button>
        <div className="">
          {`Swap`}
        </div>
      </div>
    </div>

  const Body =
    <PageBody>
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.ETHEREUM].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.ETHEREUM]}
          prices={[wethUsdtPriceQuery.data?.inner]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.WETH_ON_ETHEREUM]}
          prices={[wethUsdtPriceQuery.data?.inner]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.WBTC_ON_ETHEREUM]}
          prices={[wbtcWethPriceQuery.data?.inner, wethUsdtPriceQuery.data?.inner]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.DAI_ON_ETHEREUM]}
          prices={[]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.USDT_ON_ETHEREUM]}
          prices={[]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.USDC_ON_ETHEREUM]}
          prices={[]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.MATIC_ON_ETHEREUM]}
          prices={[maticWethPriceQuery.data?.inner, wethUsdtPriceQuery.data?.inner]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.STETH_ON_ETHEREUM]}
          prices={[wethUsdtPriceQuery.data?.inner]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.GNOSIS].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.GNOSIS]}
          prices={[]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.OPTIMISM].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[10]}
          prices={[wethUsdtPriceQuery.data?.inner]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.WBTC_ON_OPTIMISM]}
          prices={[wbtcWethPriceQuery.data?.inner, wethUsdtPriceQuery.data?.inner]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.DAI_ON_OPTIMISM]}
          prices={[]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.USDT_ON_OPTIMISM]}
          prices={[]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.USDC_ON_OPTIMISM]}
          prices={[]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.BINANCE].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.BINANCE]}
          prices={[busdtWbnbPriceQuery.data?.inner]} />
        <ContractTokenRow
          token={tokenByAddress[tokenById.BUSDT_ON_BINANCE]}
          prices={[]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.POLYGON].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.POLYGON]}
          prices={[maticWethPriceQuery.data?.inner, wethUsdtPriceQuery.data?.inner]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.ARBITRUM].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.ARBITRUM]}
          prices={[wethUsdtPriceQuery.data?.inner]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.ZKSYNC].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.ZKSYNC]}
          prices={[wethUsdtPriceQuery.data?.inner]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.AVALANCHE].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.AVALANCHE]}
          prices={[wethUsdtPriceQuery.data?.inner]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.CELO].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.CELO]}
          prices={[celoMcusdPriceQuery.data?.inner]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.LINEA].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.LINEA]}
          prices={[wethUsdtPriceQuery.data?.inner]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.BASE].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.BASE]}
          prices={[wethUsdtPriceQuery.data?.inner]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.CLASSIC].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.CLASSIC]}
          prices={[etcBusdPriceQuery.data?.inner]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.GOERLI].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.GOERLI]}
          prices={[]} />
      </div>
      <div className="h-4" />
      <div className="text-xl font-medium">
        {chainByChainId[chainIdByName.SEPOLIA].name}
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        <NativeTokenRow
          chain={chainByChainId[chainIdByName.SEPOLIA]}
          prices={[]} />
      </div>
    </PageBody>

  return <Page>
    {sendDialog.current && mainnet &&
      <WalletDataSendNativeTokenDialog title="ETH on Ethereum"
        context={mainnet}
        close={sendDialog.disable} />}
    {receiveDialog.current &&
      <WalletDataReceiveDialog
        close={receiveDialog.disable} />}
    {Header}
    {Card}
    {Apps}
    {Body}
  </Page>
}
