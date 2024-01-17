/* eslint-disable @next/next/no-img-element */
import { Colors, Gradients } from "@/libs/colors/colors";
import { UIError } from "@/libs/errors/errors";
import { ChainData, chainByChainId, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Mutators } from "@/libs/glacier/mutators";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useInputChange, useKeyboardEnter, useMouse } from "@/libs/react/events";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { ChildrenProps } from "@/libs/react/props/children";
import { ClassNameProps } from "@/libs/react/props/className";
import { AnchorProps, ButtonProps } from "@/libs/react/props/html";
import { OkProps } from "@/libs/react/props/promise";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog, Screen } from "@/libs/ui/dialog/dialog";
import { Wc, WcMetadata } from "@/libs/wconn/mods/wc/wc";
import { ContractToken, ContractTokenData, NativeToken, NativeTokenData, Token, TokenData, TokenRef } from "@/mods/background/service_worker/entities/tokens/data";
import { WalletRef } from "@/mods/background/service_worker/entities/wallets/data";
import { TokenSettings, TokenSettingsData } from "@/mods/background/service_worker/entities/wallets/tokens/data";
import { Fixed } from "@hazae41/cubane";
import { Nullable, Option, Some } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { Fragment, MouseEvent, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PageBody, UserPageHeader } from "../../../../libs/ui2/page/header";
import { Page } from "../../../../libs/ui2/page/page";
import { useBackgroundContext } from "../../background/context";
import { PathContext, Paths, useSubpath } from "../../router/path/context";
import { useEnsReverse } from "../names/data";
import { TokenAddDialog } from "../tokens/add/dialog";
import { useContractBalance, useContractPricedBalance, useNativeBalance, useNativePricedBalance, useToken, useTokens } from "../tokens/data";
import { usePairPrice } from "../tokens/pairs/data";
import { WalletDataReceiveScreen } from "./actions/receive/receive";
import { WalletSendScreen } from "./actions/send";
import { SimpleWalletDataCard } from "./card";
import { WalletDataProvider, useWalletDataContext } from "./context";
import { useEthereumContext, useEthereumContext2 } from "./data";
import { useTokenSettings, useTokenSettingsByWallet } from "./tokens/data";

export function WalletPage(props: UUIDProps) {
  const { uuid } = props

  return <WalletDataProvider uuid={uuid}>
    <WalletDataPage />
  </WalletDataProvider>
}

export function useDisplay(result: Nullable<Result<Fixed.From, Error>>) {
  return useMemo(() => {
    if (result == null)
      return "0.00"
    if (result.isErr())
      return "0.00"
    const number = Number(Fixed.from(result.unwrap()).move(5).toString())

    return number.toLocaleString(undefined)
  }, [result])
}

export function useDisplayUsd(result: Nullable<Result<Fixed.From, Error>>) {
  return useMemo(() => {
    if (result == null)
      return "0.00"
    if (result.isErr())
      return "Error"
    const number = Number(Fixed.from(result.unwrap()).move(2).toString())

    return number.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      notation: "standard"
    })
  }, [result])
}

export function useCompactDisplayUsd(result: Nullable<Result<Fixed.From, Error>>) {
  return useMemo(() => {
    if (result == null)
      return "0.00"
    if (result.isErr())
      return "Error"
    const number = Number(Fixed.from(result.unwrap()).move(2).toString())

    return number.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      notation: "compact"
    })
  }, [result])
}

export function LinkCard(props: AnchorProps) {
  const { children, ...rest } = props

  return <a className="grow group p-4 bg-contrast rounded-xl cursor-pointer focus:outline-black focus:outline-1"
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
      {children}
    </div>
  </a>
}

export function ButtonCard(props: ButtonProps) {
  const { children, ...rest } = props

  return <button className="grow group p-4 bg-contrast rounded-xl cursor-pointer focus:outline-black focus:outline-1"
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function DivLikeButton(props: ChildrenProps & ClassNameProps & { onClick: () => void }) {
  const { children, onClick, className } = props

  const onEnter = useKeyboardEnter(() => {
    onClick()
  }, [onClick])

  return <div className={className}
    role="button"
    onClick={onClick}
    onKeyDown={onEnter}
    tabIndex={0}>
    {children}
  </div>
}

function WalletDataPage() {
  const wallet = useWalletDataContext().unwrap()
  const background = useBackgroundContext().unwrap()
  const subpath = useSubpath()

  const mainnet = useEthereumContext2(wallet.uuid, chainByChainId[1]).unwrap()

  useEnsReverse(wallet.address, mainnet)

  const onSubpathClose = useCallback(() => {
    subpath.go(`/`)
  }, [subpath])

  const receiveDialog = useBooleanHandle(false)

  const [color, color2] = Gradients.get(wallet.color)

  const [all, setAll] = useState(false)
  const [edit, setEdit] = useState(false)
  const add = useBooleanHandle(false)

  const walletTokens = useTokenSettingsByWallet(wallet)
  const userTokens = useTokens()

  const allTokens = useMemo<TokenData[]>(() => {
    const natives = Object.values(chainByChainId).map(x => x.token)
    const contracts = Object.values(tokenByAddress)
    const all = [...natives, ...contracts]
    return all.sort((a, b) => a.chainId - b.chainId)
  }, [])

  const onBackClick = useCallback(() => {
    Paths.go("/wallets")
  }, [])

  const onCameraClick = useCallback(() => {
    Paths.go(`/wallet/${wallet.uuid}/camera`)
  }, [wallet])

  const onLinkClick = useCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const clipboard = await Result.runAndWrap(async () => {
        return await navigator.clipboard.readText()
      }).then(r => r.orElseSync(() => {
        return Option.wrap(prompt("Paste a WalletConnect link here")).ok()
      }).throw(t))

      const url = Result.runAndDoubleWrapSync(() => new URL(clipboard)).setErr(new UIError("You must copy a WalletConnect link")).throw(t)
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
    <UserPageHeader
      title="Wallet"
      back={onBackClick}>
      <div className="flex gap-2">
        {background.isWebsite() && <>
          <Button.Base className="size-8 hovered-or-clicked-or-focused:scale-105 !transition"
            onClick={onCameraClick}>
            <div className={`${Button.Shrinker.className}`}>
              <Outline.QrCodeIcon className="size-5" />
            </div>
          </Button.Base>
          <Button.Base className="size-8 hovered-or-clicked-or-focused:scale-105 !transition"
            onClick={onLinkClick}>
            <div className={`${Button.Shrinker.className}`}>
              <Outline.LinkIcon className="size-5" />
            </div>
          </Button.Base>
        </>}
      </div>
    </UserPageHeader>

  const Card =
    <div className="p-4 flex justify-center">
      <div className="w-full max-w-sm">
        <SimpleWalletDataCard />
        {wallet.type === "readonly" && <>
          <div className="h-2" />
          <div className="po-sm bg-contrast text-contrast rounded-xl flex items-center justify-center">
            <Outline.EyeIcon className="size-5" />
            <div className="w-2" />
            <div>
              This is a watch-only wallet
            </div>
          </div>
        </>}
      </div>
    </div>

  const Apps =
    <div className="po-md grid place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
      <LinkCard>
        <Outline.BanknotesIcon className="size-4" />
        Tokens
      </LinkCard>
      <LinkCard>
        <Outline.PaperAirplaneIcon className="size-4" />
        Transactions
      </LinkCard>
      <ButtonCard onClick={receiveDialog.enable}>
        <Outline.QrCodeIcon className="size-4" />
        Receive
      </ButtonCard>
      <LinkCard>
        <Outline.TrophyIcon className="size-4" />
        NFTs
      </LinkCard>
      <LinkCard>
        <Outline.LinkIcon className="size-4" />
        Links
      </LinkCard>
      <LinkCard>
        <Outline.CheckIcon className="size-4" />
        Approvals
      </LinkCard>
    </div>

  const Body =
    <PageBody>
      {add.current &&
        <Dialog
          close={add.disable}>
          <TokenAddDialog />
        </Dialog>}
      <div className="font-medium text-xl">
        Tokens
      </div>
      <div className="h-4" />
      <div className="flex flex-col gap-4">
        <TokenRowRouter token={chainByChainId[1].token} />
        {!edit && walletTokens.data?.get().map(tokenSettings =>
          <AddedTokenRow
            key={tokenSettings.uuid}
            settingsRef={tokenSettings} />)}
      </div>
      <div className="h-4" />
      <div className="flex items-center gap-2">
        <button className={`${Button.Base.className} po-sm bg-gradient-to-r from-${color} to-${color2} text-white self-center hovered-or-clicked-or-focused:scale-105 !transition`}
          onClick={() => setAll(!all)}>
          <div className={`${Button.Shrinker.className}`}>
            {all ? "Show less" : "Show more"}
          </div>
        </button>
        <div className="grow" />
        {all &&
          <button className={`${Button.Base.className} po-sm bg-gradient-to-r from-${color} to-${color2} text-white self-center hovered-or-clicked-or-focused:scale-105 !transition`}
            onClick={() => setEdit(!edit)}>
            <div className={`${Button.Shrinker.className}`}>
              {edit ? "Done" : "Edit"}
            </div>
          </button>}
        <button className={`${Button.Base.className} po-sm bg-gradient-to-r from-${color} to-${color2} text-white self-center hovered-or-clicked-or-focused:scale-105 !transition`}
          onClick={add.enable}>
          <div className={`${Button.Shrinker.className}`}>
            {"Add"}
          </div>
        </button>
      </div>
      <div className="h-4" />
      {all &&
        <TokensEditContext.Provider value={edit}>
          <div className="flex flex-col gap-4">
            {allTokens.map(token =>
              <Fragment key={token.uuid}>
                {token.uuid !== chainByChainId[1].token.uuid &&
                  <UnaddedTokenRow token={token} />}
              </Fragment>)}
            {userTokens.data?.get().map(token =>
              <UnaddedTokenRow
                key={token.uuid}
                token={token} />)}
          </div>
        </TokensEditContext.Provider>}
    </PageBody>

  return <Page>
    <PathContext.Provider value={subpath}>
      {subpath.url.pathname === "/send" && wallet.type !== "readonly" &&
        <Screen close={onSubpathClose}>
          <WalletSendScreen />
        </Screen>}
    </PathContext.Provider>
    {receiveDialog.current &&
      <Screen dark
        close={receiveDialog.disable}>
        <WalletDataReceiveScreen />
      </Screen>}
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

function AddedTokenRow(props: { settingsRef: TokenSettings }) {
  const wallet = useWalletDataContext().unwrap()

  const { settingsRef } = props
  const { token } = settingsRef

  const settings = useTokenSettings(wallet, token)

  if (token.type === "native" && token.chainId === 1)
    return null
  if (!settings.data?.get().enabled)
    return null
  return <TokenRowRouter token={settings.data.get().token} />
}

function UnaddedTokenRow(props: { token: Token }) {
  const edit = useTokensEditContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const { token } = props

  const settings = useTokenSettings(wallet, token)

  if (settings.data?.get().enabled && !edit)
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

  const tokenQuery = useToken(token.chainId, token.address)
  const tokenData = tokenQuery.data?.get() ?? tokenByAddress[token.address]
  const chainData = chainByChainId[token.chainId]

  if (tokenData == null)
    return null

  return <ContractTokenRow
    token={tokenData}
    chain={chainData} />
}

function NativeTokenRow(props: { token: NativeTokenData } & { chain: ChainData }) {
  const { token, chain } = props
  const wallet = useWalletDataContext().unwrap()
  const edit = useTokensEditContext().unwrap()
  const subpath = useSubpath()

  const context = useEthereumContext2(wallet.uuid, chain).unwrap()

  const onClick = useCallback(() => {
    subpath.go(`/send?step=target&chain=${context?.chain.chainId}`)
  }, [subpath, context])

  const [prices, setPrices] = useState(new Array<Nullable<Fixed.From>>(token.pairs?.length ?? 0))

  const balanceQuery = useNativeBalance(wallet.address, "pending", context, prices)
  const balanceDisplay = useDisplay(balanceQuery.current)

  const balanceUsdFixed = useNativePricedBalance(wallet.address, "usd", context)
  const balanceUsdDisplay = useDisplayUsd(balanceUsdFixed.current)

  const onPrice = useCallback(([index, data]: [number, Nullable<Fixed.From>]) => {
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
        ok={onPrice} />)}
    {!edit &&
      <ClickableTokenRow
        ok={onClick}
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
  const wallet = useWalletDataContext().unwrap()
  const edit = useTokensEditContext().unwrap()
  const subpath = useSubpath()

  const context = useEthereumContext2(wallet.uuid, chain).unwrap()

  const [prices, setPrices] = useState(new Array<Nullable<Fixed.From>>(token.pairs?.length ?? 0))

  const balanceQuery = useContractBalance(wallet.address, token, "pending", context, prices)
  const balanceDisplay = useDisplay(balanceQuery.current)

  const onSendClick = useCallback(() => {
    subpath.go(`/send?step=target&chain=${context?.chain.chainId}&token=${token.address}`)
  }, [subpath, context, token])

  const balanceUsdFixed = useContractPricedBalance(wallet.address, token, "usd", context)
  const balanceUsdDisplay = useDisplayUsd(balanceUsdFixed.current)

  const onPrice = useCallback(([index, data]: [number, Nullable<Fixed.From>]) => {
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
        ok={onPrice} />)}
    {!edit &&
      <ClickableTokenRow
        ok={onSendClick}
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

export function PriceResolver(props: { index: number } & { address: string } & OkProps<[number, Nullable<Fixed.From>]>) {
  const { ok, index, address } = props
  const wallet = useWalletDataContext().unwrap()

  const pairData = pairByAddress[address]
  const chainData = chainByChainId[pairData.chainId]

  const context = useEthereumContext(wallet.uuid, chainData)

  const { data } = usePairPrice(pairData, "pending", context)

  useEffect(() => {
    ok([index, data?.inner])
  }, [index, data, ok])

  return null
}

function ClickableTokenRow(props: { token: TokenData } & { chain: ChainData } & { balanceDisplay: string } & { balanceUsdDisplay: string } & OkProps<MouseEvent<HTMLElement>>) {
  const { ok, token, chain, balanceDisplay, balanceUsdDisplay } = props

  const onClick = useMouse(e => {
    ok(e)
  }, [ok])

  const tokenId = token.type === "native"
    ? token.chainId + token.symbol
    : token.chainId + token.address + token.symbol
  const modtoken = Colors.get(useModhash(`${tokenId}`))

  return <button className="po-sm group flex items-center text-left"
    onClick={onClick}>
    <div className={`relative h-12 w-12 flex items-center justify-center bg-${modtoken} text-white rounded-full`}>
      <div className=""
        style={{ fontSize: `${Math.min((20 - (2 * token.symbol.length)), 16)}px` }}>
        {token.symbol}
      </div>
      <div className="absolute -bottom-2 -left-2">
        {chain.icon()}
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
  const wallet = useWalletDataContext().unwrap()

  const settings = useTokenSettings(wallet, token)
  const checked = settings.data?.get().enabled

  const onToggle = useInputChange(async e => {
    const enabled = e.currentTarget.checked

    await settings.mutate(s => {
      const data = Mutators.Datas.mapOrNew((d = {
        uuid: crypto.randomUUID(),
        token: TokenRef.from(token),
        wallet: WalletRef.from(wallet),
        enabled
      }): TokenSettingsData => {
        return { ...d, enabled }
      }, s.real?.data)

      return new Some(data)
    })
  }, [])

  const tokenId = token.type === "native"
    ? token.chainId + token.symbol
    : token.chainId + token.address + token.symbol
  const modtoken = Colors.get(useModhash(`${tokenId}`))

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
      <div className="absolute -bottom-2 -left-2">
        {chain.icon()}
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