/* eslint-disable @next/next/no-img-element */
import { Gradients } from "@/libs/colors/colors";
import { UIError } from "@/libs/errors/errors";
import { ContractTokenData, EthereumChain, EthereumChainId, TokenData, chainByChainId, chainIdByName, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Fixed, FixedInit } from "@/libs/fixed/fixed";
import { Outline } from "@/libs/icons/icons";
import { useInputChange } from "@/libs/react/events";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { ChildrenProps } from "@/libs/react/props/children";
import { OkProps } from "@/libs/react/props/promise";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Url } from "@/libs/url/url";
import { Wc, WcMetadata } from "@/libs/wconn/mods/wc/wc";
import { Mutators } from "@/libs/xswr/mutators";
import { WalletRef } from "@/mods/background/service_worker/entities/wallets/data";
import { ContractTokenRef, NativeTokenRef, TokenRef, TokenSettingsData, TokenSettingsRef } from "@/mods/background/service_worker/entities/wallets/tokens/data";
import { Nullable, Option, Some } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBackground } from "../../background/context";
import { PageBody, PageHeader } from "../../components/page/header";
import { Page } from "../../components/page/page";
import { Path } from "../../router/path/context";
import { WalletDataReceiveDialog } from "./actions/receive/receive";
import { WalletDataSendContractTokenDialog } from "./actions/send/contract";
import { WalletDataSendNativeTokenDialog } from "./actions/send/native";
import { WalletDataCard } from "./card";
import { useChain } from "./chains/data";
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

function NativeTokenRow(props: {
  chain: EthereumChain,
  prices: Nullable<FixedInit>[]
}) {
  const { chain, prices } = props
  const wallet = useWalletData()

  const context = useEthereumContext(wallet.uuid, chain)

  const balanceQuery = useBalance(wallet.address, context, prices)
  const balanceDisplay = useDisplay(balanceQuery.current)

  const sendDialog = useBooleanHandle(false)

  const balanceUsdFixed = usePricedBalance(wallet.address, "usd", context)
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
  token: ContractTokenData,
  prices: Nullable<FixedInit>[]
}) {
  const { token, prices } = props
  const chain = chainByChainId[token.chainId]
  const wallet = useWalletData()

  const context = useEthereumContext(wallet.uuid, chain)

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

function WalletDataChain(props: { chainId: EthereumChainId } & ChildrenProps) {
  const { chainId, children } = props
  const wallet = useWalletData()

  const settings = useChain(wallet.uuid, chainId)
  const enabled = settings.data?.inner.enabled

  const onToggle = useInputChange(e => {
    const { checked } = e.currentTarget

    settings.mutate(s => {
      const data = Mutators.Datas.mapOrNew((d = { uuid: wallet.uuid, chainId }) => {
        return { ...d, enabled: checked }
      }, s.real?.data)

      return new Ok(new Some(data))
    })
  }, [])

  return <>
    <label className="flex items-center">
      <div className="text-xl font-medium grow">
        {chainByChainId[chainId].name}
      </div>
      <input className=""
        type="checkbox"
        checked={enabled}
        onChange={onToggle} />
    </label>
    {Boolean(settings.data?.inner.enabled) && <>
      <div className="h-4" />
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </>}
  </>
}

function WalletDataPage() {
  const wallet = useWalletData()
  const background = useBackground().unwrap()

  const mainnet = useEthereumContext(wallet.uuid, chainByChainId[chainIdByName.ETHEREUM])

  useEnsReverse(wallet.address, mainnet)

  const sendDialog = useBooleanHandle(false)
  const receiveDialog = useBooleanHandle(false)

  const [color, color2] = Gradients.get(wallet.color)

  const tokens = useTokenSettingsByWallet(wallet)

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
      {tokens.data?.inner.map(tokenSettings =>
        <TokenSettingsRow
          key={tokenSettings.uuid}
          settingsRef={tokenSettings} />)}
      <AddableTokenRow token={chainByChainId[1].token} />
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


function TokenSettingsRow(props: { settingsRef: TokenSettingsRef }) {
  const { settingsRef } = props
  const { wallet, token } = settingsRef

  const settings = useTokenSettings(wallet, token)

  if (!settings.data?.inner.enabled)
    return null
  return <TokenRow tokenRef={settings.data.inner.token} />
}

function TokenRow(props: { tokenRef: TokenRef }) {
  const { tokenRef } = props

  if (tokenRef.type === "native")
    return <NativeTokenRow2 tokenRef={tokenRef} />
  if (tokenRef.type === "contract")
    return <ContractTokenRow2 tokenRef={tokenRef} />
  return null
}

function NativeTokenRow2(props: { tokenRef: NativeTokenRef }) {
  const { tokenRef } = props
  const wallet = useWalletData()

  const chain = chainByChainId[tokenRef.chainId]
  const context = useEthereumContext(wallet.uuid, chain)

  const [prices, setPrices] = useState<Nullable<FixedInit>[]>([])

  const onPrice = useCallback(([index, data]: [number, Nullable<FixedInit>]) => {
    setPrices(prices => {
      prices[index] = data
      return [...prices]
    })
  }, [])

  return <>
    {chain.token.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        context={context}
        ok={onPrice} />)}
    <NativeTokenRow
      chain={chain}
      prices={prices} />
  </>
}

function ContractTokenRow2(props: { tokenRef: ContractTokenRef }) {
  const { tokenRef } = props
  const wallet = useWalletData()

  const token = tokenByAddress[tokenRef.address]
  const chain = chainByChainId[token.chainId]
  const context = useEthereumContext(wallet.uuid, chain)

  const [prices, setPrices] = useState<Nullable<FixedInit>[]>([])

  const onPrice = useCallback(([index, data]: [number, Nullable<FixedInit>]) => {
    setPrices(prices => {
      prices[index] = data
      return [...prices]
    })
  }, [])

  return <>
    {token.pairs?.map((address, i) =>
      <PriceResolver key={i}
        index={i}
        address={address}
        context={context}
        ok={onPrice} />)}
    <ContractTokenRow
      token={token}
      prices={prices} />
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

function AddableTokenRow(props: { token: TokenData }) {
  const { token } = props
  const wallet = useWalletData()

  const settings = useTokenSettings(wallet, token)
  const enabled = settings.data?.inner.enabled

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

  return <label className="flex items-center">
    <div className="grow">
      {token.name}
    </div>
    <input className=""
      type="checkbox"
      checked={enabled}
      onChange={onToggle} />
  </label>
}