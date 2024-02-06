/* eslint-disable @next/next/no-img-element */
import { Color } from "@/libs/colors/colors";
import { Errors, UIError } from "@/libs/errors/errors";
import { ChainData, chainByChainId, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Mutators } from "@/libs/glacier/mutators";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { isExtension } from "@/libs/platform/platform";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useKeyboardEnter, useMouse } from "@/libs/react/events";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { ChildrenProps } from "@/libs/react/props/children";
import { ClassNameProps } from "@/libs/react/props/className";
import { AnchorProps } from "@/libs/react/props/html";
import { OkProps } from "@/libs/react/props/promise";
import { UUIDProps } from "@/libs/react/props/uuid";
import { State } from "@/libs/react/state";
import { Dialog, Dialog2, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Menu } from "@/libs/ui2/menu/menu";
import { Wc, WcMetadata } from "@/libs/wconn/mods/wc/wc";
import { ContractToken, ContractTokenData, NativeToken, NativeTokenData, Token, TokenData, TokenRef } from "@/mods/background/service_worker/entities/tokens/data";
import { WalletRef } from "@/mods/background/service_worker/entities/wallets/data";
import { TokenSettings, TokenSettingsData } from "@/mods/background/service_worker/entities/wallets/tokens/data";
import { Fixed, ZeroHexString } from "@hazae41/cubane";
import { None, Nullable, Option, Optional, Some } from "@hazae41/option";
import { Result } from "@hazae41/result";
import { Fragment, MouseEvent, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PageBody, UserPageHeader } from "../../../../libs/ui2/page/header";
import { Page } from "../../../../libs/ui2/page/page";
import { useBackgroundContext } from "../../background/context";
import { HashSubpathProvider, Paths, useHashSubpath, usePathContext } from "../../router/path/context";
import { useEnsReverse } from "../names/data";
import { TokenAddDialog } from "../tokens/add/dialog";
import { useContractBalance, useContractPricedBalance, useNativeBalance, useNativePricedBalance, useToken, useTokens } from "../tokens/data";
import { usePairPrice } from "../tokens/pairs/data";
import { SmallShrinkableContrastButton, useGenius } from "../users/all/page";
import { WalletEditDialog } from "./actions/edit";
import { WalletDataReceiveScreen } from "./actions/receive/receive";
import { PaddedRoundedShrinkableNakedAnchor, WalletSendScreen, WideShrinkableNakedMenuAnchor, WideShrinkableNakedMenuButton } from "./actions/send";
import { RawWalletDataCard } from "./card";
import { WalletDataProvider, useWalletDataContext } from "./context";
import { EthereumWalletInstance, useEthereumContext, useEthereumContext2, useWallet } from "./data";
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

export function AnchorCard(props: AnchorProps) {
  const { children, ...rest } = props

  return <a className="grow group p-4 bg-contrast rounded-xl cursor-pointer focus:outline-black focus:outline-1"
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-active:scale-90 transition-transform">
      {children}
    </div>
  </a>
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
  const path = usePathContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const subpath = useHashSubpath(path)

  const mainnet = useEthereumContext2(wallet.uuid, chainByChainId[1]).unwrap()

  useEnsReverse(wallet.address, mainnet)

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

  const connect = useGenius(subpath, "/connect")
  const receive = useGenius(subpath, "/receive")

  const $flip = useState(false)
  const [flip] = $flip

  const $privateKey = useState<Optional<ZeroHexString>>()
  const [privateKey, setPrivateKey] = $privateKey

  const onUnflip = useCallback(() => {
    setPrivateKey(undefined)
  }, [setPrivateKey])

  const Header =
    <UserPageHeader
      title="Wallet"
      back={onBackClick}>
      <div className="flex items-center gap-2">
        {!isExtension() &&
          <PaddedRoundedShrinkableNakedAnchor
            onKeyDown={connect.onKeyDown}
            onClick={connect.onClick}
            href={connect.href}>
            <img className="size-5"
              alt="WalletConnect"
              src="/assets/wc.svg" />
          </PaddedRoundedShrinkableNakedAnchor>}
      </div>
    </UserPageHeader>

  const Card =
    <div className="p-4 flex justify-center">
      <div className="w-full max-w-sm">
        <div className="w-full aspect-video rounded-xl">
          <RawWalletDataCard
            privateKey={privateKey}
            flip={flip}
            unflip={onUnflip}
            href="/menu" />
        </div>
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
      <AnchorCard>
        <Outline.BanknotesIcon className="size-4" />
        Tokens
      </AnchorCard>
      <AnchorCard>
        <Outline.PaperAirplaneIcon className="size-4" />
        Transactions
      </AnchorCard>
      <AnchorCard
        onKeyDown={receive.onKeyDown}
        onClick={receive.onClick}
        href={receive.href}>
        <Outline.QrCodeIcon className="size-4" />
        Receive
      </AnchorCard>
      <AnchorCard>
        <Outline.TrophyIcon className="size-4" />
        NFTs
      </AnchorCard>
      <AnchorCard>
        <Outline.LinkIcon className="size-4" />
        Links
      </AnchorCard>
      <AnchorCard>
        <Outline.CheckIcon className="size-4" />
        Approvals
      </AnchorCard>
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
        <SmallShrinkableContrastButton
          onClick={() => setAll(!all)}>
          {all
            ? <Outline.ChevronUpIcon className="size-5" />
            : <Outline.ChevronDownIcon className="size-5" />}
          {all ? "Show less" : "Show more"}
        </SmallShrinkableContrastButton>
        <div className="grow" />
        {all && <>
          <SmallShrinkableContrastButton
            onClick={() => setEdit(!edit)}>
            {edit
              ? <Outline.CheckIcon className="size-5" />
              : <Outline.PencilIcon className="size-5" />}
            {edit ? "Done" : "Edit"}
          </SmallShrinkableContrastButton>
          <SmallShrinkableContrastButton
            onClick={add.enable}>
            <Outline.PlusIcon className="size-5" />
            {"Add"}
          </SmallShrinkableContrastButton>
        </>}
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
    <HashSubpathProvider>
      {subpath.url.pathname === "/connect" &&
        <Menu>
          <WalletConnectMenu />
        </Menu>}
      {subpath.url.pathname === "/send" &&
        <Dialog2>
          <WalletSendScreen />
        </Dialog2>}
      {subpath.url.pathname === "/edit" &&
        <Dialog2>
          <WalletEditDialog />
        </Dialog2>}
      {subpath.url.pathname === "/receive" &&
        <Dialog2 dark>
          <WalletDataReceiveScreen />
        </Dialog2>}
      {subpath.url.pathname === "/menu" &&
        <Menu>
          <WalletMenu
            $privateKey={$privateKey}
            $flip={$flip} />
        </Menu>}
    </HashSubpathProvider>
    {Header}
    {Card}
    {Apps}
    {Body}
  </Page>
}

export function WalletMenu(props: {
  $flip: State<boolean>,
  $privateKey: State<Optional<ZeroHexString>>
}) {
  const path = usePathContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const background = useBackgroundContext().unwrap()
  const close = useCloseContext().unwrap()
  const { $flip, $privateKey } = props

  const [flip, setFlip] = $flip
  const [privateKey, setPrivateKey] = $privateKey

  const edit = useGenius(path, "/edit")

  const flipOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    const instance = await EthereumWalletInstance.tryFrom(wallet, background).then(r => r.unwrap())
    const privateKey = await instance.tryGetPrivateKey(background).then(r => r.unwrap())

    setPrivateKey(privateKey)
    setFlip(true)

    close()
  }), [background, close, setFlip, setPrivateKey, wallet])

  const onUnflipClick = useCallback(async () => {
    setFlip(false)

    close()
  }, [close, setFlip])

  const walletQuery = useWallet(wallet.uuid)

  const trashOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await walletQuery.mutate(s => {
      const current = s.real?.current

      if (current == null)
        return new None()
      if (current.isErr())
        return new None()

      return new Some(current.mapSync(w => ({ ...w, trashed: true })).setTimes({ ...current, expiration: Date.now() + 30 * 24 * 60 * 15 * 1000 }))
    })

    close()
  }), [close, walletQuery])

  const untrashOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await walletQuery.mutate(s => {
      const current = s.real?.current

      if (current == null)
        return new None()
      if (current.isErr())
        return new None()

      return new Some(current.mapSync(w => ({ ...w, trashed: undefined })).setTimes({ ...current, expiration: undefined }))
    })

    close()
  }), [close, walletQuery])

  return <div className="flex flex-col text-left gap-2">
    <WideShrinkableNakedMenuAnchor
      onClick={edit.onClick}
      onKeyDown={edit.onKeyDown}
      href={edit.href}>
      <Outline.PencilIcon className="size-4" />
      Edit
    </WideShrinkableNakedMenuAnchor>
    {!privateKey &&
      <WideShrinkableNakedMenuButton
        disabled={flipOrAlert.loading}
        onClick={flipOrAlert.run}>
        <Outline.EyeIcon className="size-4" />
        Flip
      </WideShrinkableNakedMenuButton>}
    {privateKey &&
      <WideShrinkableNakedMenuButton
        onClick={onUnflipClick}>
        <Outline.EyeSlashIcon className="size-4" />
        Unflip
      </WideShrinkableNakedMenuButton>}
    {!wallet.trashed &&
      <WideShrinkableNakedMenuButton
        disabled={trashOrAlert.loading}
        onClick={trashOrAlert.run}>
        <Outline.TrashIcon className="size-4" />
        Trash
      </WideShrinkableNakedMenuButton>}
    {wallet.trashed &&
      <WideShrinkableNakedMenuButton
        disabled={untrashOrAlert.loading}
        onClick={untrashOrAlert.run}>
        <Outline.TrashIcon className="size-4" />
        Untrash
      </WideShrinkableNakedMenuButton>}
  </div>
}


export function WalletConnectMenu() {
  const wallet = useWalletDataContext().unwrap()
  const background = useBackgroundContext().unwrap()
  const close = useCloseContext().unwrap()

  const connectOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    const clipboard = await Result.runAndWrap(async () => {
      return await navigator.clipboard.readText()
    }).then(r => r.orElseSync(() => {
      return Option.wrap(prompt("Paste a WalletConnect link here")).ok()
    }).unwrap())

    const url = Result.runAndDoubleWrapSync(() => {
      return new URL(clipboard)
    }).mapErrSync(() => {
      return new UIError("You must copy a WalletConnect link")
    }).unwrap()

    await Wc.tryParse(url).then(r => r.mapErrSync(() => {
      return new UIError("You must copy a WalletConnect link")
    }).unwrap())

    alert(`Connecting...`)

    const metadata = await background.tryRequest<WcMetadata>({
      method: "brume_wc_connect",
      params: [clipboard, wallet.uuid]
    }).then(r => r.unwrap().unwrap())

    alert(`Connected to ${metadata.name}`)

    close()
  }), [wallet, background, close])

  return <div className="flex flex-col text-left gap-2">
    <WideShrinkableNakedMenuAnchor
      href={`#/wallet/${wallet.uuid}/camera`}>
      <Outline.QrCodeIcon className="size-4" />
      Scan
    </WideShrinkableNakedMenuAnchor>
    <WideShrinkableNakedMenuButton
      disabled={connectOrAlert.loading}
      onClick={connectOrAlert.run}>
      <Outline.LinkIcon className="size-4" />
      Paste
    </WideShrinkableNakedMenuButton>
  </div>
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
  const path = usePathContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const edit = useTokensEditContext().unwrap()
  const { token, chain } = props

  const subpath = useHashSubpath(path)

  const context = useEthereumContext2(wallet.uuid, chain).unwrap()

  const onClick = useCallback(() => {
    if (wallet.type === "readonly")
      return
    location.replace(subpath.go(`/send?step=target&chain=${context?.chain.chainId}`))
  }, [wallet, subpath, context])

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
  const path = usePathContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const edit = useTokensEditContext().unwrap()
  const { token, chain } = props

  const subpath = useHashSubpath(path)

  const context = useEthereumContext2(wallet.uuid, chain).unwrap()

  const [prices, setPrices] = useState(new Array<Nullable<Fixed.From>>(token.pairs?.length ?? 0))

  const balanceQuery = useContractBalance(wallet.address, token, "pending", context, prices)
  const balanceDisplay = useDisplay(balanceQuery.current)

  const onSendClick = useCallback(() => {
    if (wallet.type === "readonly")
      return
    location.replace(subpath.go(`/send?step=target&chain=${context?.chain.chainId}&token=${token.address}`))
  }, [wallet, subpath, context, token])

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

  const modhash = useModhash(tokenId)
  const color = Color.get(modhash)

  return <button className="po-sm group flex items-center text-left"
    onClick={onClick}>
    <div className={`relative h-12 w-12 flex items-center justify-center bg-${color}-400 dark:bg-${color}-500 text-white rounded-full`}>
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

  const modhash = useModhash(tokenId)
  const color = Color.get(modhash)

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
    <div className={`relative h-12 w-12 flex items-center justify-center bg-${color}-400 dark:bg-${color}-500 text-white rounded-full`}>
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