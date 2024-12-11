/* eslint-disable @next/next/no-img-element */
import { Color } from "@/libs/colors/colors";
import { Errors, UIError } from "@/libs/errors/errors";
import { ChainData, chainDataByChainId, strictChainDataByChainId, tokenByAddress } from "@/libs/ethereum/mods/chain";
import { useDisplayRaw, useDisplayUsd } from "@/libs/fixed";
import { Outline, Solid } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { AnchorProps } from "@/libs/react/props/html";
import { UUIDProps } from "@/libs/react/props/uuid";
import { State } from "@/libs/react/state";
import { Records } from "@/libs/records";
import { PaddedRoundedClickableNakedAnchor, WideClickableNakedMenuAnchor } from "@/libs/ui/anchor";
import { ClickableContrastButton, WideClickableNakedMenuButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { Loading, SmallUnflexLoading } from "@/libs/ui/loading";
import { Menu } from "@/libs/ui/menu";
import { PageBody, UserPageHeader } from "@/libs/ui/page/header";
import { UserPage } from "@/libs/ui/page/page";
import { GapperAndClickerInAnchorDiv } from "@/libs/ui/shrinker";
import { Balance } from "@/mods/universal/ethereum/mods/tokens/mods/balance";
import { useContractTokenBalance, useContractTokenPricedBalance, useNativeTokenBalance, useNativeTokenPricedBalance, useOfflineContractTokenBalance, useOfflineContractTokenPricedBalance, useOfflineNativeTokenBalance, useOfflineNativeTokenPricedBalance } from "@/mods/universal/ethereum/mods/tokens/mods/balance/hooks";
import { useRankedToken } from "@/mods/universal/ethereum/mods/tokens/mods/contest/hooks";
import { ContractTokenData, ContractTokenInfo, NativeTokenData, NativeTokenInfo, Token, TokenData, TokenInfo, TokenRef } from "@/mods/universal/ethereum/mods/tokens/mods/core";
import { useContractToken, useUserTokens, useWalletTokens } from "@/mods/universal/ethereum/mods/tokens/mods/core/hooks";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { Address, Fixed, ZeroHexString } from "@hazae41/cubane";
import { Data, Fail, Fetched } from "@hazae41/glacier";
import { Wc, WcMetadata } from "@hazae41/latrine";
import { None, Option, Optional, Some } from "@hazae41/option";
import { CloseContext, useCloseContext } from "@hazae41/react-close-context";
import { Result } from "@hazae41/result";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Fragment, useCallback, useMemo, useState } from "react";
import { useBackgroundContext } from "../../background/context";
import { useUserStorageContext } from "../../user/mods/storage";
import { useEnsReverse } from "../names/data";
import { TokenAddDialog } from "../tokens/add/dialog";
import { WalletEditDialog } from "./actions/edit";
import { WalletDataReceiveScreen } from "./actions/receive/receive";
import { WalletSendScreen } from "./actions/send";
import { RawWalletDataCard } from "./card";
import { useWalletDataContext, WalletDataProvider } from "./context";
import { EthereumWalletInstance, useEthereumContext, useWallet } from "./data";

export function WalletPage(props: UUIDProps) {
  const { uuid } = props

  return <WalletDataProvider uuid={uuid}>
    <WalletDataPage />
  </WalletDataProvider>
}

export function AnchorCard(props: AnchorProps) {
  const { children, ...rest } = props

  return <a className="grow group p-4 bg-contrast rounded-xl cursor-pointer focus:outline-black focus:outline-1"
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}

function WalletDataPage() {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()

  const subpath = useHashSubpath(path)

  const mainnet = useEthereumContext(wallet.uuid, chainDataByChainId[1]).getOrThrow()

  useEnsReverse(wallet.address, mainnet)

  const add = useBooleanHandle(false)

  const userTokensQuery = useUserTokens()

  const walletTokensQuery = useWalletTokens(wallet)

  const [walletTokens, userTokens, builtinTokens] = useMemo(() => {
    const [wallets = []] = [walletTokensQuery.data?.get()]
    const [users = []] = [userTokensQuery.data?.get()]

    const natives = Object.values(chainDataByChainId).map(x => x.token)
    const contracts = Object.values(tokenByAddress)
    const builtins = [...natives, ...contracts]

    const sorter = (a: Token, b: Token) => {
      const dChainId = a.chainId - b.chainId

      if (dChainId !== 0)
        return dChainId

      if (a.type === "native")
        return -1
      if (b.type === "native")
        return 1

      return 0
    }

    return [wallets, users, builtins].map(x => x.sort(sorter))
  }, [userTokensQuery.data, walletTokensQuery.data])

  const onBackClick = useCallback(() => {
    location.assign("#/wallets")
  }, [])

  const connect = useCoords(subpath, "/connect")
  const receive = useCoords(subpath, "/receive")

  const $flip = useState(false)
  const [flip, setFlip] = $flip

  const $privateKey = useState<Optional<ZeroHexString>>()
  const [privateKey, setPrivateKey] = $privateKey

  const onUnflip = useCallback(() => {
    setPrivateKey(undefined)
    setFlip(false)
  }, [setFlip, setPrivateKey])

  const Header =
    <UserPageHeader title="Wallet">
      <div className="flex items-center gap-2">
        <PaddedRoundedClickableNakedAnchor
          onKeyDown={connect.onKeyDown}
          onClick={connect.onClick}
          href={connect.href}>
          <img className="size-5"
            alt="WalletConnect"
            src="/assets/wc.svg" />
        </PaddedRoundedClickableNakedAnchor>
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
        <CloseContext.Provider value={add.disable}>
          <Dialog>
            <TokenAddDialog />
          </Dialog>
        </CloseContext.Provider>}
      {walletTokens.length > 0 && <>
        <div className="font-medium text-xl">
          Favorite tokens
        </div>
        <div className="h-4" />
        <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
          {walletTokens.map(token =>
            <Fragment key={token.uuid}>
              <OnlineTokenRow token={token} />
            </Fragment>)}
        </div>
        <div className="h-2" />
      </>}
      <div className="font-medium text-xl">
        Top tokens
      </div>
      <div className="h-4" />
      <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
        <RankedTokenRow rank={0} />
        <RankedTokenRow rank={1} />
        <RankedTokenRow rank={2} />
      </div>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <div className="font-medium text-xl">
          Other tokens
        </div>
        <div className="grow" />
        <ClickableContrastButton
          onClick={add.enable}>
          <Outline.PlusIcon className="size-5" />
          {"Add"}
        </ClickableContrastButton>
      </div>
      <div className="h-4" />
      <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
        {userTokens.map(token =>
          <Fragment key={token.uuid}>
            <OfflineTokenRow token={token} />
          </Fragment>)}
        {builtinTokens.map(token =>
          <Fragment key={token.uuid}>
            <OfflineTokenRow token={token} />
          </Fragment>)}
      </div>
    </PageBody>

  return <UserPage>
    <HashSubpathProvider>
      {subpath.url.pathname === "/connect" &&
        <Menu>
          <WalletConnectMenu />
        </Menu>}
      {subpath.url.pathname === "/send" &&
        <Dialog>
          <WalletSendScreen />
        </Dialog>}
      {subpath.url.pathname === "/edit" &&
        <Dialog>
          <WalletEditDialog />
        </Dialog>}
      {subpath.url.pathname === "/receive" &&
        <Dialog dark>
          <WalletDataReceiveScreen />
        </Dialog>}
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
  </UserPage>
}

export function RankedTokenRow(props: { rank: number }) {
  const wallet = useWalletDataContext().getOrThrow()
  const { rank } = props

  const mainnet = useEthereumContext(wallet.uuid, strictChainDataByChainId[1]).getOrThrow()

  const tokenQuery = useRankedToken(mainnet, "latest", rank)
  const tokenInfo = tokenQuery.data?.get()

  if (tokenInfo == null)
    return <div className="flex items-center justify-center po-md">
      <Loading className="size-5" />
    </div>

  const chainData = Records.getOrNull(chainDataByChainId, tokenInfo.chainId)

  if (chainData == null)
    return null

  return <OfflineTokenRow token={tokenInfo} />
}

export function WalletMenu(props: {
  $flip: State<boolean>,
  $privateKey: State<Optional<ZeroHexString>>
}) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()
  const close = useCloseContext().getOrThrow()
  const { $flip, $privateKey } = props

  const [flip, setFlip] = $flip
  const [privateKey, setPrivateKey] = $privateKey

  const edit = useCoords(path, "/edit")

  const flipOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const instance = await EthereumWalletInstance.createOrThrow(wallet, background)
    const privateKey = await instance.getPrivateKeyOrThrow(background)

    setPrivateKey(privateKey)
    setFlip(true)

    close()
  }), [background, close, setFlip, setPrivateKey, wallet])

  const onUnflipClick = useCallback(async () => {
    setFlip(false)

    close()
  }, [close, setFlip])

  const walletQuery = useWallet(wallet.uuid)

  const trashOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await walletQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new None()
      if (current.isErr())
        return new None()

      return new Some(current.mapSync(w => ({ ...w, trashed: true })).setInit({ ...current, expiration: Date.now() + (30 * 24 * 60 * 15 * 1000) }))
    })

    close()
  }), [close, walletQuery])

  const untrashOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await walletQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new None()
      if (current.isErr())
        return new None()

      return new Some(current.mapSync(w => ({ ...w, trashed: undefined })).setInit({ ...current, expiration: undefined }))
    })

    close()
  }), [close, walletQuery])

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuAnchor
      onClick={edit.onClick}
      onKeyDown={edit.onKeyDown}
      href={edit.href}>
      <Outline.PencilIcon className="size-4" />
      Edit
    </WideClickableNakedMenuAnchor>
    {!privateKey &&
      <WideClickableNakedMenuButton
        disabled={flipOrAlert.loading}
        onClick={flipOrAlert.run}>
        <Outline.EyeIcon className="size-4" />
        Flip
      </WideClickableNakedMenuButton>}
    {privateKey &&
      <WideClickableNakedMenuButton
        onClick={onUnflipClick}>
        <Outline.EyeSlashIcon className="size-4" />
        Unflip
      </WideClickableNakedMenuButton>}
    {!wallet.trashed &&
      <WideClickableNakedMenuButton
        disabled={trashOrAlert.loading}
        onClick={trashOrAlert.run}>
        <Outline.TrashIcon className="size-4" />
        Trash
      </WideClickableNakedMenuButton>}
    {wallet.trashed &&
      <WideClickableNakedMenuButton
        disabled={untrashOrAlert.loading}
        onClick={untrashOrAlert.run}>
        <Outline.TrashIcon className="size-4" />
        Untrash
      </WideClickableNakedMenuButton>}
  </div>
}

export function WalletConnectMenu() {
  const wallet = useWalletDataContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()
  const close = useCloseContext().getOrThrow()

  const connectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const clipboard = await Result.runAndWrap(async () => {
      return await navigator.clipboard.readText()
    }).then(r => r.orElseSync(() => {
      return Option.wrap(prompt("Paste a WalletConnect link here")).ok()
    }).getOrThrow())

    const url = Result.runAndWrapSync(() => {
      return new URL(clipboard)
    }).mapErrSync(() => {
      return new UIError("You must copy a WalletConnect link")
    }).getOrThrow()

    Result.runAndWrapSync(() => {
      return Wc.parseOrThrow(url)
    }).mapErrSync(() => {
      return new UIError("You must copy a WalletConnect link")
    }).getOrThrow()

    alert(`Connecting...`)

    const metadata = await background.requestOrThrow<WcMetadata>({
      method: "brume_wc_connect",
      params: [clipboard, wallet.uuid]
    }).then(r => r.getOrThrow())

    alert(`Connected to ${metadata.name}`)

    close()
  }), [wallet, background, close])

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuAnchor
      href={`#/wallet/${wallet.uuid}/camera`}>
      <Outline.QrCodeIcon className="size-4" />
      Scan
    </WideClickableNakedMenuAnchor>
    <WideClickableNakedMenuButton
      disabled={connectOrAlert.loading}
      onClick={connectOrAlert.run}>
      <Outline.LinkIcon className="size-4" />
      Paste
    </WideClickableNakedMenuButton>
  </div>
}

function OnlineTokenRow(props: { token: TokenInfo }) {
  const { token } = props

  if (token.type === "native")
    return <OnlineNativeTokenRow token={token} />
  if (token.type === "contract")
    return <OnlineContractTokenRow token={token} />
  return null
}

function OfflineTokenRow(props: { token: TokenInfo }) {
  const { token } = props

  if (token.type === "native")
    return <OfflineNativeTokenRow token={token} />
  if (token.type === "contract")
    return <OfflineContractTokenRow token={token} />
  return null
}

function OnlineNativeTokenRow(props: { token: NativeTokenInfo }) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const { token } = props

  const chainData = chainDataByChainId[token.chainId]
  const tokenData = chainData.token

  const subpath = useHashSubpath(path)
  const menu = useCoords(subpath, `/token/${tokenData.chainId}`)

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const valuedBalanceQuery = useNativeTokenBalance(context, wallet.address as Address, "latest")
  const pricedBalanceQuery = useNativeTokenPricedBalance(context, wallet.address as Address, "latest")

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === `/token/${tokenData.chainId}` &&
        <Menu>
          <NativeTokenMenu
            tokenData={tokenData}
            chainData={chainData} />
        </Menu>}
    </HashSubpathProvider>
    <TokenRowAnchor
      href={menu.href}
      onClick={menu.onClick}
      onContextMenu={menu.onContextMenu}
      token={tokenData}
      chain={chainData}
      balanceQuery={valuedBalanceQuery}
      balanceUsdQuery={pricedBalanceQuery} />
  </>
}

function OfflineNativeTokenRow(props: { token: NativeTokenInfo }) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const { token } = props

  const chainData = chainDataByChainId[token.chainId]
  const tokenData = chainData.token

  const subpath = useHashSubpath(path)
  const menu = useCoords(subpath, `/token/${tokenData.chainId}`)

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const valuedBalanceQuery = useOfflineNativeTokenBalance(context, wallet.address as Address, "latest")
  const pricedBalanceQuery = useOfflineNativeTokenPricedBalance(context, wallet.address as Address, "latest")

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === `/token/${tokenData.chainId}` &&
        <Menu>
          <NativeTokenMenu
            tokenData={tokenData}
            chainData={chainData} />
        </Menu>}
    </HashSubpathProvider>
    <TokenRowAnchor
      href={menu.href}
      onClick={menu.onClick}
      onContextMenu={menu.onContextMenu}
      token={tokenData}
      chain={chainData}
      balanceQuery={valuedBalanceQuery}
      balanceUsdQuery={pricedBalanceQuery} />
  </>
}

function OnlineContractTokenRow(props: { token: ContractTokenInfo }) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const { token } = props

  const chainData = chainDataByChainId[token.chainId]

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const tokenQuery = useContractToken(context, token.address, "latest")
  const maybeTokenData = tokenQuery.data?.get()

  const subpath = useHashSubpath(path)
  const menu = useCoords(subpath, `/token/${token.chainId}/${token.address}`)

  const valuedBalanceQuery = useContractTokenBalance(context, token.address, wallet.address as Address, "latest")
  const pricedBalanceQuery = useContractTokenPricedBalance(context, token.address, wallet.address as Address, "latest")

  if (maybeTokenData == null)
    return null

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === `/token/${token.chainId}/${token.address}` &&
        <Menu>
          <ContractTokenMenu
            tokenData={maybeTokenData}
            chainData={chainData} />
        </Menu>}
    </HashSubpathProvider>
    <TokenRowAnchor
      href={menu.href}
      onClick={menu.onClick}
      onContextMenu={menu.onContextMenu}
      token={maybeTokenData}
      chain={chainData}
      balanceQuery={valuedBalanceQuery}
      balanceUsdQuery={pricedBalanceQuery} />
  </>
}

function OfflineContractTokenRow(props: { token: ContractTokenInfo }) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const { token } = props

  const chainData = chainDataByChainId[token.chainId]

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const tokenQuery = useContractToken(context, token.address, "latest")
  const maybeTokenData = tokenQuery.data?.get()

  const subpath = useHashSubpath(path)
  const menu = useCoords(subpath, `/token/${token.chainId}/${token.address}`)

  const valuedBalanceQuery = useOfflineContractTokenBalance(context, token.address, wallet.address as Address, "latest")
  const pricedBalanceQuery = useOfflineContractTokenPricedBalance(context, token.address, wallet.address as Address, "latest")

  if (maybeTokenData == null)
    return null

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === `/token/${token.chainId}/${token.address}` &&
        <Menu>
          <ContractTokenMenu
            tokenData={maybeTokenData}
            chainData={chainData} />
        </Menu>}
    </HashSubpathProvider>
    <TokenRowAnchor
      href={menu.href}
      onClick={menu.onClick}
      onContextMenu={menu.onContextMenu}
      token={maybeTokenData}
      chain={chainData}
      balanceQuery={valuedBalanceQuery}
      balanceUsdQuery={pricedBalanceQuery} />
  </>
}

function NativeTokenMenu(props: { tokenData: NativeTokenData, chainData: ChainData }) {
  const close = useCloseContext().getOrThrow()
  const storage = useUserStorageContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const { tokenData, chainData } = props

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const send = useCoords(path, `/send?step=target&chain=${tokenData.chainId}`)

  const walletTokensQuery = useWalletTokens(wallet)

  const favorited = useMemo(() => {
    return walletTokensQuery.data?.get().find(x => x.uuid === tokenData.uuid) != null
  }, [walletTokensQuery.data, tokenData])

  const favoriteOrThrow = useCallback(async () => {
    await walletTokensQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new Some(new Data([TokenRef.from(tokenData)]))

      return new Some(current.mapSync(array => [...array, TokenRef.from(tokenData)]))
    })
  }, [walletTokensQuery.mutateOrThrow, tokenData])

  const unfavoriteOrThrow = useCallback(async () => {
    await walletTokensQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new None()

      return new Some(current.mapSync(array => array.filter(x => x.uuid !== tokenData.uuid)))
    })
  }, [walletTokensQuery.mutateOrThrow, tokenData])

  const toggleOrLogAndAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!favorited)
      await favoriteOrThrow()
    else
      await unfavoriteOrThrow()

    close(true)
  }), [favorited, favoriteOrThrow, unfavoriteOrThrow, close])

  const fetchOrLogAndAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    Balance.Native.queryOrThrow(context, wallet.address as Address, "latest", storage)!.refetchOrThrow({ cache: "reload" }).catch(console.warn)
    Balance.Priced.Native.queryOrThrow(context, wallet.address as Address, "latest", storage)!.refetchOrThrow({ cache: "reload" }).catch(console.warn)

    close(true)
  }), [context, wallet, storage, close])

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuButton
      onClick={toggleOrLogAndAlert.run}>
      {favorited ? <Solid.StarIcon className="size-4" /> : <Outline.StarIcon className="size-4" />}
      {favorited ? "Unfavorite" : "Favorite"}
    </WideClickableNakedMenuButton>
    <WideClickableNakedMenuButton
      onClick={fetchOrLogAndAlert.run}>
      <Outline.ArrowPathIcon className="size-4" />
      Refresh
    </WideClickableNakedMenuButton>
    <WideClickableNakedMenuAnchor
      aria-disabled={wallet.type === "readonly"}
      onClick={send.onClick}
      onKeyDown={send.onKeyDown}
      href={send.href}>
      <Outline.PaperAirplaneIcon className="size-4" />
      Send
    </WideClickableNakedMenuAnchor>
    <WideClickableNakedMenuAnchor
      aria-disabled>
      <Outline.BanknotesIcon className="size-4" />
      Faucet
    </WideClickableNakedMenuAnchor>
  </div>
}

function ContractTokenMenu(props: { tokenData: ContractTokenData, chainData: ChainData }) {
  const close = useCloseContext().getOrThrow()
  const storage = useUserStorageContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const { tokenData, chainData } = props

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const send = useCoords(path, `/send?step=target&chain=${tokenData.chainId}&token=${tokenData.address}`)

  const walletTokensQuery = useWalletTokens(wallet)

  const favorited = useMemo(() => {
    return walletTokensQuery.data?.get().find(x => x.uuid === tokenData.uuid) != null
  }, [walletTokensQuery.data, tokenData])

  const favoriteOrThrow = useCallback(async () => {
    await walletTokensQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new Some(new Data([TokenRef.from(tokenData)]))

      return new Some(current.mapSync(array => [...array, TokenRef.from(tokenData)]))
    })
  }, [walletTokensQuery.mutateOrThrow, tokenData])

  const unfavoriteOrThrow = useCallback(async () => {
    await walletTokensQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new None()

      return new Some(current.mapSync(array => array.filter(x => x.uuid !== tokenData.uuid)))
    })
  }, [walletTokensQuery.mutateOrThrow, tokenData])

  const toggleOrLogAndAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!favorited)
      await favoriteOrThrow()
    else
      await unfavoriteOrThrow()

    close(true)
  }), [favorited, favoriteOrThrow, unfavoriteOrThrow, close])

  const fetchOrLogAndAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    Balance.Contract.queryOrThrow(context, tokenData.address, wallet.address as Address, "latest", storage)!.refetchOrThrow({ cache: "reload" }).catch(console.warn)
    Balance.Priced.Contract.queryOrThrow(context, tokenData.address, wallet.address as Address, "latest", storage)!.refetchOrThrow({ cache: "reload" }).catch(console.warn)

    close(true)
  }), [context, wallet, tokenData, storage, close])

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuButton
      onClick={toggleOrLogAndAlert.run}>
      {favorited ? <Solid.StarIcon className="size-4" /> : <Outline.StarIcon className="size-4" />}
      {favorited ? "Unfavorite" : "Favorite"}
    </WideClickableNakedMenuButton>
    <WideClickableNakedMenuButton
      onClick={fetchOrLogAndAlert.run}>
      <Outline.ArrowPathIcon className="size-4" />
      Refresh
    </WideClickableNakedMenuButton>
    <WideClickableNakedMenuAnchor
      aria-disabled={wallet.type === "readonly"}
      onClick={send.onClick}
      onKeyDown={send.onKeyDown}
      href={send.href}>
      <Outline.PaperAirplaneIcon className="size-4" />
      Send
    </WideClickableNakedMenuAnchor>
    <WideClickableNakedMenuAnchor
      aria-disabled>
      <Outline.BanknotesIcon className="size-4" />
      Faucet
    </WideClickableNakedMenuAnchor>
  </div>
}

export interface QueryLike<D, E> {
  readonly data?: Data<D>
  readonly error?: Fail<E>
  readonly current?: Fetched<D, E>
  readonly fetching?: boolean
}

function TokenRowAnchor(props: { token: TokenData } & { chain: ChainData } & { balanceQuery: QueryLike<Fixed.From, Error> } & { balanceUsdQuery: QueryLike<Fixed.From, Error> } & AnchorProps) {
  const { token, chain, balanceQuery, balanceUsdQuery, ...others } = props

  const tokenId = token.type === "native"
    ? token.chainId + token.symbol
    : token.chainId + token.address + token.symbol

  const modhash = useModhash(tokenId)
  const color = Color.get(modhash)

  const balanceDisplay = useDisplayRaw(balanceQuery.data?.get())
  const balanceUsdDisplay = useDisplayUsd(balanceUsdQuery.data?.get())

  return <a className="po-sm group flex items-center text-left"
    {...others}>
    <div className={`relative h-12 w-12 flex items-center justify-center bg-${color}-400 dark:bg-${color}-500 text-white rounded-full shrink-0`}>
      <div className=""
        style={{ fontSize: `${Math.min((20 - (2 * token.symbol.length)), 16)}px` }}>
        {token.symbol}
      </div>
      <div className="absolute -bottom-2 -left-2">
        {chain.icon()}
      </div>
    </div>
    <div className="w-4 shrink-0" />
    <div className="grow min-w-0">
      <div className="flex items-center">
        <div className="truncate">
          {`${token.name} `}<span className="text-contrast">on</span>{` ${chain.name}`}
        </div>
      </div>
      <div className="flex items-center text-contrast gap-1">
        <div>{balanceDisplay} {token.symbol}</div>
        {balanceQuery.error != null && <ExclamationTriangleIcon className="h-4 mt-0.5" />}
        {balanceQuery.fetching && <SmallUnflexLoading />}
      </div>
      <div className="flex items-center text-contrast gap-1">
        <div>{balanceUsdDisplay}</div>
        {balanceUsdQuery.error != null && <ExclamationTriangleIcon className="h-4 mt-0.5" />}
        {balanceUsdQuery.fetching && <SmallUnflexLoading />}
      </div>
    </div>
  </a>
}