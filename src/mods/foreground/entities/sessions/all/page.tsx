/* eslint-disable @next/next/no-img-element */
import { Errors } from "@/libs/errors/errors"
import { ChainData, chainByChainId } from "@/libs/ethereum/mods/chain"
import { Outline } from "@/libs/icons/icons"
import { isSafariExtension } from "@/libs/platform/platform"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { OkProps } from "@/libs/react/props/promise"
import { useCloseContext } from "@/libs/ui/dialog/dialog"
import { ImageWithFallback } from "@/libs/ui/image/image_with_fallback"
import { Menu } from "@/libs/ui2/menu/menu"
import { PageBody, UserPageHeader } from "@/libs/ui2/page/header"
import { Page } from "@/libs/ui2/page/page"
import { BlobbyData } from "@/mods/background/service_worker/entities/blobbys/data"
import { ExSessionData, Session, SessionData } from "@/mods/background/service_worker/entities/sessions/data"
import { useBackgroundContext } from "@/mods/foreground/background/context"
import { HashSubpathProvider, useHashSubpath, usePathContext } from "@/mods/foreground/router/path/context"
import { Nullable, Option } from "@hazae41/option"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useBlobby } from "../../blobbys/data"
import { useOrigin } from "../../origins/data"
import { useGenius } from "../../users/all/page"
import { PaddedRoundedShrinkableNakedAnchor, PaddedRoundedShrinkableNakedButton, WideShrinkableNakedMenuAnchor, WideShrinkableNakedMenuButton } from "../../wallets/actions/send"
import { useSession } from "../data"
import { useStatus } from "../status/data"
import { usePersistentSessions, useTemporarySessions } from "./data"

export function SessionsPage() {
  const background = useBackgroundContext().unwrap()

  const tempSessionsQuery = useTemporarySessions()
  const maybeTempSessions = tempSessionsQuery.data?.get()

  const persSessionsQuery = usePersistentSessions()
  const maybePersSessions = persSessionsQuery.data?.get()

  const length = useMemo(() => {
    const temp = maybeTempSessions?.length || 0
    const pers = maybePersSessions?.length || 0
    return temp + pers
  }, [maybeTempSessions, maybePersSessions])

  const disconnectAllOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (!isSafariExtension() && confirm(`Do you want to disconnect all sessions?`) === false)
      return

    for (const session of Option.wrap(maybeTempSessions).unwrapOr([]))
      await background.requestOrThrow({
        method: "brume_disconnect",
        params: [session.id]
      }).then(r => r.unwrap())

    for (const session of Option.wrap(maybePersSessions).unwrapOr([]))
      await background.requestOrThrow({
        method: "brume_disconnect",
        params: [session.id]
      }).then(r => r.unwrap())

    return
  }), [background, maybePersSessions])

  const Body =
    <PageBody>
      <div className="flex flex-col gap-2">
        {maybeTempSessions?.map(session =>
          <SessionRow
            key={session.id}
            session={session} />)}
        {maybePersSessions?.map(session =>
          <SessionRow
            key={session.id}
            session={session} />)}
      </div>
    </PageBody>

  const Header = <>
    <UserPageHeader title="Sessions">
      <PaddedRoundedShrinkableNakedButton
        disabled={disconnectAllOrAlert.loading || !length}
        onClick={disconnectAllOrAlert.run}>
        <Outline.TrashIcon className="size-5" />
      </PaddedRoundedShrinkableNakedButton>
    </UserPageHeader>
    <div className="po-md flex items-center">
      <div className="text-contrast">
        {`Sessions allow you to connect to applications. These applications can then make requests for you to approve.`}
      </div>
    </div>
  </>

  return <Page>
    {Header}
    {Body}
  </Page>
}

export function SessionRow(props: { session: Session }) {
  const { session } = props
  const path = usePathContext().unwrap()

  const subpath = useHashSubpath(path)
  const menu = useGenius(subpath, `/${session.id}/menu`)

  const sessionQuery = useSession(session.id)
  const maybeSessionData = sessionQuery.data?.get()

  const originQuery = useOrigin(maybeSessionData?.origin)
  const maybeOriginData = originQuery.data?.get()

  const statusQuery = useStatus(session.id)
  const maybeStatusData = statusQuery.data?.get()

  const [iconDatas, setIconDatas] = useState<Nullable<BlobbyData>[]>([])

  const onIconData = useCallback(([index, data]: [number, Nullable<BlobbyData>]) => {
    setIconDatas(iconDatas => {
      iconDatas[index] = data
      return [...iconDatas]
    })
  }, [])

  if (maybeSessionData == null)
    return null
  if (maybeOriginData == null)
    return null

  return <div role="button" className="po-md rounded-xl flex items-center gap-4"
    onContextMenu={menu.onContextMenu}
    onKeyDown={menu.onKeyDown}
    onClick={menu.onClick}>
    <HashSubpathProvider>
      {subpath.url.pathname === `/${session.id}/menu` &&
        <Menu>
          <SessionMenu sessionData={maybeSessionData} />
        </Menu>}
      {subpath.url.pathname === `/${session.id}/chains` && maybeSessionData.type !== "wc" &&
        <Menu>
          <ChainsMenu sessionData={maybeSessionData} />
        </Menu>}
    </HashSubpathProvider>
    {maybeOriginData.icons?.map((x, i) =>
      <IndexedBlobbyLoader
        key={x.id}
        index={i}
        id={x.id}
        ok={onIconData} />)}
    <div className="relative shrink-0">
      {(() => {
        if (maybeStatusData == null)
          return <div className="absolute top-0 -right-2 bg-blue-400 rounded-full w-2 h-2" />
        if (maybeStatusData.error == null)
          return <div className="absolute top-0 -right-2 bg-green-400 rounded-full w-2 h-2" />
        return <div className="absolute top-0 -right-2 bg-red-400 rounded-full w-2 h-2" />
      })()}
      <ImageWithFallback className="size-10"
        alt="icon"
        src={iconDatas.find(Boolean)?.data}>
        <Outline.CubeTransparentIcon className="size-10" />
      </ImageWithFallback>
    </div>
    <div className="grow">
      <div className="font-medium">
        {maybeOriginData.title}
      </div>
      <div className="text-contrast">
        {maybeOriginData.origin}
      </div>
    </div>
    <PaddedRoundedShrinkableNakedAnchor>
      <Outline.EllipsisVerticalIcon className="size-5" />
    </PaddedRoundedShrinkableNakedAnchor>
  </div>
}

function IndexedBlobbyLoader(props: OkProps<[number, Nullable<BlobbyData>]> & { id: string, index: number }) {
  const { index, id, ok } = props

  const { data } = useBlobby(id)

  useEffect(() => {
    ok([index, data?.inner])
  }, [index, data, ok])

  return null
}

export function SessionMenu(props: { sessionData: SessionData }) {
  const { sessionData } = props
  const path = usePathContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const chains = useGenius(path, `/${sessionData.id}/chains`)

  const disconnectOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_disconnect",
      params: [sessionData.id]
    }).then(r => r.unwrap())
  }), [background, sessionData])

  return <div className="flex flex-col text-left gap-2 w-[160px] overflow-x-hidden">
    {sessionData.type !== "wc" &&
      <WideShrinkableNakedMenuAnchor
        onClick={chains.onClick}
        onKeyDown={chains.onKeyDown}
        href={chains.href}>
        <Outline.LinkIcon className="shrink-0 size-4" />
        <div className="truncate">
          {sessionData.chain.name}
        </div>
      </WideShrinkableNakedMenuAnchor>}
    <WideShrinkableNakedMenuButton
      disabled={disconnectOrAlert.loading}
      onClick={disconnectOrAlert.run}>
      <Outline.XMarkIcon className="size-4" />
      Disconnect
    </WideShrinkableNakedMenuButton>
  </div>
}

export function ChainsMenu(props: { sessionData: ExSessionData }) {
  const { sessionData } = props

  return <div className="flex flex-col text-left gap-2 w-[160px] overflow-x-hidden">
    {Object.values(chainByChainId).map(chain =>
      <ChainRow
        key={chain.chainId}
        sessionData={sessionData}
        chainData={chain} />)}
  </div>
}

export function ChainRow(props: { sessionData: ExSessionData, chainData: ChainData }) {
  const { sessionData, chainData } = props
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const switchOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_switchEthereumChain",
      params: [sessionData.id, chainData.chainId]
    }).then(r => r.unwrap())

    close()
  }), [background, sessionData, chainData, close])

  return <WideShrinkableNakedMenuButton
    disabled={switchOrAlert.loading}
    onClick={switchOrAlert.run}>
    {sessionData.chain.chainId === chainData.chainId &&
      <Outline.CheckIcon className="shrink-0 size-4" />}
    <div className="truncate">
      {chainData.name}
    </div>
  </WideShrinkableNakedMenuButton>
}