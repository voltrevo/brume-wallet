/* eslint-disable @next/next/no-img-element */
import { Colors, Gradients } from "@/libs/colors/colors";
import { UIError } from "@/libs/errors/errors";
import { ChainData, ContractTokenData, NativeTokenData, TokenData, chainByChainId, chainIdByName, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Fixed, FixedInit } from "@/libs/fixed/fixed";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useInputChange } from "@/libs/react/events";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { OkProps } from "@/libs/react/props/promise";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Url } from "@/libs/url/url";
import { Wc, WcMetadata } from "@/libs/wconn/mods/wc/wc";
import { Mutators } from "@/libs/xswr/mutators";
import { WalletRef } from "@/mods/background/service_worker/entities/wallets/data";
import { ContractToken, NativeToken, Token, TokenRef, TokenSettingsData, TokenSettingsRef } from "@/mods/background/service_worker/entities/wallets/tokens/data";
import { Nullable, Option, Some } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useBackground } from "../../background/context";
import { PageBody, PageHeader } from "../../components/page/header";
import { Page } from "../../components/page/page";
import { Path } from "../../router/path/context";
import { WalletDataReceiveDialog } from "./actions/receive/receive";
import { WalletDataSendContractTokenDialog } from "./actions/send/contract";
import { WalletDataSendNativeTokenDialog } from "./actions/send/native";
import { WalletDataCard } from "./card";
import { WalletDataProvider, useWalletData } from "./context";
import { EthereumContext, useBalance, useEnsReverse, useEthereumContext, usePairPrice, usePricedBalance, useTokenBalance, useTokenPricedBalance } from "./data";
import { useTokenSettings, useTokenSettingsByWallet } from "./tokens/data";

export function WalletPage(props: UUIDProps) {
  const { uuid } = props

  return <WalletDataProvider uuid={uuid}>
    <WalletDataPage />
  </WalletDataProvider>
}

export function useDisplay(option: Nullable<Result<FixedInit, Error>>) {
  return useMemo(() => {
    return Option.wrap(option).mapSync(result => result.mapSync(fixed => {
      return Number(Fixed.from(fixed).move(5).toDecimalString()).toLocaleString(undefined)
    }).mapErrSync(() => "Error").inner).unwrapOr("...")
  }, [option])
}

export function useDisplayUsd(option: Nullable<Result<FixedInit, Error>>) {
  return useMemo(() => {
    return Option.wrap(option).mapSync(result => result.mapSync(fixed => {
      return Number(Fixed.from(fixed).move(2).toDecimalString()).toLocaleString(undefined, { style: "currency", currency: "USD" })
    }).mapErrSync(() => "Error").inner).unwrapOr("...")
  }, [option])
}

export function useCompactDisplayUsd(option: Nullable<Result<FixedInit, Error>>) {
  return useMemo(() => {
    return Option.wrap(option).mapSync(result => result.mapSync(fixed => {
      return Number(Fixed.from(fixed).move(2).toDecimalString()).toLocaleString(undefined, { style: "currency", currency: "USD", notation: "compact" })
    }).mapErrSync(() => "Error").inner).unwrapOr("??")
  }, [option])
}

function WalletDataPage() {
  const wallet = useWalletData()
  const background = useBackground().unwrap()

  const mainnet = useEthereumContext(wallet.uuid, chainByChainId[chainIdByName.ETHEREUM])

  useEnsReverse(wallet.address, mainnet)

  const sendDialog = useBooleanHandle(false)
  const receiveDialog = useBooleanHandle(false)

  const [color, color2] = Gradients.get(wallet.color)

  const [all, setAll] = useState(false)
  const [edit, setEdit] = useState(false)

  const tokens = useTokenSettingsByWallet(wallet)

  const allTokens = useMemo<TokenData[]>(() => {
    const natives = Object.values(chainByChainId).map(x => x.token)
    const contracts = Object.values(tokenByAddress)
    const all = [...natives, ...contracts]
    return all.sort((a, b) => a.chainId - b.chainId)
  }, [])

  const onBackClick = useCallback(() => {
    Path.go("/wallets")
  }, [])

  const onCameraClick = useCallback(() => {
    Path.go(`/wallet/${wallet.uuid}/camera`)
  }, [wallet])

  const onLinkClick = useCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const clipboard = await Result.runAndDoubleWrap(async () => {
        return await navigator.clipboard.readText()
      }).then(r => r.throw(t))

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
        {background.isWebsite() && <>
          <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
            onClick={onCameraClick}>
            <Button.Shrinker>
              <Outline.QrCodeIcon className="s-sm" />
            </Button.Shrinker>
          </Button.Naked>
          <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
            onClick={onLinkClick}>
            <Button.Shrinker>
              <Outline.LinkIcon className="s-sm" />
            </Button.Shrinker>
          </Button.Naked>
        </>}
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
    </div>

  const Body =
    <PageBody>
      <div className="font-medium text-xl">
        Tokens
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-4">
        <TokenRowRouter token={chainByChainId[1].token} />
        {!edit && tokens.data?.inner.map(tokenSettings =>
          <AddedTokenRow
            key={tokenSettings.uuid}
            settingsRef={tokenSettings} />)}
      </div>
      <div className="h-4" />
      <div className="flex items-center justify-between">
        <button className={`${Button.Naked.className} po-sm bg-gradient-to-r from-${color} to-${color2} text-white self-center hovered-or-clicked-or-focused:scale-105 transition`}
          onClick={() => setAll(!all)}>
          <div className={`${Button.Shrinker.className}`}>
            {all ? "Show less" : "Show more"}
          </div>
        </button>
        {all &&
          <button className={`${Button.Naked.className} po-sm bg-gradient-to-r from-${color} to-${color2} text-white self-center hovered-or-clicked-or-focused:scale-105 transition`}
            onClick={() => setEdit(!edit)}>
            <div className={`${Button.Shrinker.className}`}>
              {edit ? "Done" : "Edit"}
            </div>
          </button>}
      </div>
      <div className="h-4" />
      {all &&
        <TokensEditContext.Provider value={edit}>
          <div className="flex flex-col gap-4">
            {allTokens.map((token, i) => <>
              {!(token.type === "native" && token.chainId === 1) &&
                <UnaddedTokenRow
                  key={i}
                  token={token} />}
            </>)}
          </div>
        </TokensEditContext.Provider>}
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

const TokensEditContext = createContext(false)

function useTokensEditContext() {
  return Option.wrap(useContext(TokensEditContext))
}

function AddedTokenRow(props: { settingsRef: TokenSettingsRef }) {
  const wallet = useWalletData()

  const { settingsRef } = props
  const { token } = settingsRef

  const settings = useTokenSettings(wallet, token)

  if (token.type === "native" && token.chainId === 1)
    return null
  if (!settings.data?.inner.enabled)
    return null
  return <TokenRowRouter token={settings.data.inner.token} />
}

function UnaddedTokenRow(props: { token: TokenData }) {
  const edit = useTokensEditContext().unwrap()
  const wallet = useWalletData()
  const { token } = props

  const settings = useTokenSettings(wallet, token)

  if (settings.data?.inner.enabled && !edit)
    return null
  return <TokenRowRouter token={token} />
}

function TokenRowRouter(props: { token: Token }) {
  const { token } = props

  if (token.type === "native")
    return <NativeTokenResolver token={token} />
  if (token.type === "contract")
    return <ContractTokenResolver token={token} />
  return null
}

function NativeTokenResolver(props: { token: NativeToken }) {
  const { token } = props

  const chainData = chainByChainId[token.chainId]
  const tokenData = chainData.token

  return <NativeTokenRow
    token={tokenData}
    chain={chainData} />
}

function ContractTokenResolver(props: { token: ContractToken }) {
  const { token } = props

  const tokenData = tokenByAddress[token.address]
  const chainData = chainByChainId[token.chainId]

  return <ContractTokenRow
    token={tokenData}
    chain={chainData} />
}

function NativeTokenRow(props: { token: NativeTokenData } & { chain: ChainData }) {
  const { token, chain } = props
  const wallet = useWalletData()
  const edit = useTokensEditContext().unwrap()

  const context = useEthereumContext(wallet.uuid, chain)

  const [prices, setPrices] = useState<Nullable<FixedInit>[]>([])

  const balanceQuery = useBalance(wallet.address, context, prices)
  const balanceDisplay = useDisplay(balanceQuery.current)

  const sendDialog = useBooleanHandle(false)

  const balanceUsdFixed = usePricedBalance(wallet.address, "usd", context)
  const balanceUsdDisplay = useDisplayUsd(balanceUsdFixed.current)

  const onPrice = useCallback(([index, data]: [number, Nullable<FixedInit>]) => {
    setPrices(prices => {
      prices[index] = data
      return [...prices]
    })
  }, [])

  return <>
    {sendDialog.current && context &&
      <WalletDataSendNativeTokenDialog
        title={`${token.name} on ${chain.name}`}
        context={context}
        close={sendDialog.disable} />}
    {chain.token.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        context={context}
        ok={onPrice} />)}
    {!edit &&
      <ClickableTokenRow
        ok={sendDialog.enable}
        token={token}
        chain={chain}
        balanceDisplay={balanceDisplay}
        balanceUsdDisplay={balanceUsdDisplay} />}
    {edit &&
      <CheckableTokenRow
        token={token}
        chain={chain}
        balanceDisplay={balanceDisplay}
        balanceUsdDisplay={balanceUsdDisplay} />}
  </>
}

function ContractTokenRow(props: { token: ContractTokenData } & { chain: ChainData }) {
  const { token, chain } = props
  const wallet = useWalletData()
  const edit = useTokensEditContext().unwrap()

  const context = useEthereumContext(wallet.uuid, chain)

  const [prices, setPrices] = useState<Nullable<FixedInit>[]>([])

  const balanceQuery = useTokenBalance(wallet.address, token, context, prices)
  const balanceDisplay = useDisplay(balanceQuery.current)

  const sendDialog = useBooleanHandle(false)

  const balanceUsdFixed = useTokenPricedBalance(context, wallet.address, token, "usd")
  const balanceUsdDisplay = useDisplayUsd(balanceUsdFixed.current)

  const onPrice = useCallback(([index, data]: [number, Nullable<FixedInit>]) => {
    setPrices(prices => {
      prices[index] = data
      return [...prices]
    })
  }, [])

  return <>
    {sendDialog.current && context &&
      <WalletDataSendContractTokenDialog
        title={`${token.name} on ${chain.name}`}
        context={context}
        token={token}
        close={sendDialog.disable} />}
    {token.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        context={context}
        ok={onPrice} />)}
    {!edit &&
      <ClickableTokenRow
        ok={sendDialog.enable}
        token={token}
        chain={chain}
        balanceDisplay={balanceDisplay}
        balanceUsdDisplay={balanceUsdDisplay} />}
    {edit &&
      <CheckableTokenRow
        token={token}
        chain={chain}
        balanceDisplay={balanceDisplay}
        balanceUsdDisplay={balanceUsdDisplay} />}
  </>
}

function PriceResolver(props: { index: number } & { address: string } & { context: Nullable<EthereumContext> } & OkProps<[number, Nullable<FixedInit>]>) {
  const { ok, index, address, context } = props
  const pair = pairByAddress[address]

  const { data } = usePairPrice(context, pair)

  useEffect(() => {
    ok([index, data?.inner])
  }, [index, data, ok])

  return null
}

function ClickableTokenRow(props: { token: TokenData } & { chain: ChainData } & { balanceDisplay: string } & { balanceUsdDisplay: string } & OkProps<void>) {
  const { ok, token, chain, balanceDisplay, balanceUsdDisplay } = props

  const onClick = useCallback(() => {
    ok()
  }, [ok])

  const tokenId = token.type === "native"
    ? token.chainId + token.symbol
    : token.chainId + token.address + token.symbol

  const modtoken = Colors.get(useModhash(`${tokenId}`))
  const modchain = Colors.get(useModhash(`${chain.chainId}`))

  return <button className="po-sm group flex items-center text-left"
    onClick={onClick}>
    <div className={`relative h-12 w-12 flex items-center justify-center bg-${modtoken} text-white rounded-full`}>
      <div className=""
        style={{ fontSize: `${Math.min((20 - (2 * token.symbol.length)), 16)}px` }}>
        {token.symbol}
      </div>
      <div className={`absolute -bottom-2 -left-2 h-6 w-6 bg-${modchain} rounded-full flex items-center justify-center`}>
        {chain.name[0]}
      </div>
    </div>
    <div className="w-4" />
    <div className="grow">
      <div className="flex items-center">
        <div className="grow flex items-center gap-1">
          <span className="">
            {token.name}
          </span>
          <span className="text-contrast">
            on
          </span>
          <span className="">
            {chain.name}
          </span>
        </div>
        <div className="">
          {balanceUsdDisplay}
        </div>
      </div>
      <div className="text-contrast">
        {balanceDisplay} {token.symbol}
      </div>
    </div>
  </button>
}

function CheckableTokenRow(props: { token: TokenData } & { chain: ChainData } & { balanceDisplay: string } & { balanceUsdDisplay: string }) {
  const { token, chain, balanceDisplay, balanceUsdDisplay } = props
  const wallet = useWalletData()

  const settings = useTokenSettings(wallet, token)
  const checked = settings.data?.inner.enabled

  const onToggle = useInputChange(async e => {
    const enabled = e.currentTarget.checked

    await settings.mutate(s => {
      const data = Mutators.Datas.mapOrNew((d = {
        uuid: crypto.randomUUID(),
        token: TokenRef.from(token),
        wallet: WalletRef.from(wallet)
      }): TokenSettingsData => {
        return { ...d, enabled }
      }, s.real?.data)

      return new Ok(new Some(data))
    }).then(Results.logAndAlert)
  }, [])

  const tokenId = token.type === "native"
    ? token.chainId + token.symbol
    : token.chainId + token.address + token.symbol

  const modtoken = Colors.get(useModhash(`${tokenId}`))
  const modchain = Colors.get(useModhash(`${chain.chainId}`))

  return <label className={`po-sm group flex items-center`}>
    <input className="appearance-none"
      type="checkbox"
      checked={checked}
      onChange={onToggle} />
    <div className="h-6 w-6 border border-contrast rounded-full aria-checked:bg-blue-500 flex items-center justify-center transition-colors"
      aria-checked={checked}>
      <div className="text-white invisible aria-checked:visible"
        aria-checked={checked}>
        {`✓`}
      </div>
    </div>
    <div className="w-4" />
    <div className={`relative h-12 w-12 flex items-center justify-center bg-${modtoken} text-white rounded-full`}>
      <div className=""
        style={{ fontSize: `${Math.min((20 - (2 * token.symbol.length)), 16)}px` }}>
        {token.symbol}
      </div>
      <div className={`absolute -bottom-2 -left-2 h-6 w-6 bg-${modchain} rounded-full flex items-center justify-center`}>
        {chain.name[0]}
      </div>
    </div>
    <div className="w-4" />
    <div className="grow">
      <div className="flex items-center">
        <div className="grow flex items-center gap-1">
          <span className="">
            {token.name}
          </span>
          <span className="text-contrast">
            on
          </span>
          <span className="">
            {chain.name}
          </span>
        </div>
        <div className="">
          {balanceUsdDisplay}
        </div>
      </div>
      <div className="text-contrast">
        {balanceDisplay} {token.symbol}
      </div>
    </div>
  </label>
}