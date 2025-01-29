/* eslint-disable @next/next/no-img-element */
import { Errors } from "@/libs/errors/errors"
import { ChainData, chainDataByChainId } from "@/libs/ethereum/mods/chain"
import { Outline } from "@/libs/icons/icons"
import { isSafariExtension } from "@/libs/platform/platform"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { OkProps } from "@/libs/react/props/promise"
import { PaddedRoundedClickableNakedAnchor, WideClickableNakedMenuAnchor } from "@/libs/ui/anchor"
import { PaddedRoundedClickableNakedButton, WideClickableNakedMenuButton } from "@/libs/ui/button"
import { ImageWithFallback } from "@/libs/ui/image"
import { Menu } from "@/libs/ui/menu"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { ExSessionData, Session, SessionData } from "@/mods/background/service_worker/entities/sessions/data"
import { useBackgroundContext } from "@/mods/foreground/background/context"
import { useLocaleContext } from "@/mods/foreground/global/mods/locale"
import { Locale } from "@/mods/foreground/locale"
import { UserGuardBody } from "@/mods/foreground/user/mods/guard"
import { BlobbyData } from "@/mods/universal/entities/blobbys"
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin"
import { Nullable, Option } from "@hazae41/option"
import { useCloseContext } from "@hazae41/react-close-context"
import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { useBlobby } from "../../blobbys/data"
import { useOrigin } from "../../origins/data"
import { useSession } from "../data"
import { useStatus } from "../status/data"
import { usePersistentSessions, useTemporarySessions } from "./data"

export function SessionsPage() {
  const lang = useLocaleContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const tempSessionsQuery = useTemporarySessions()
  const maybeTempSessions = tempSessionsQuery.data?.get()

  const persSessionsQuery = usePersistentSessions()
  const maybePersSessions = persSessionsQuery.data?.get()

  const length = useMemo(() => {
    const temp = maybeTempSessions?.length || 0
    const pers = maybePersSessions?.length || 0
    return temp + pers
  }, [maybeTempSessions, maybePersSessions])

  const disconnectAllOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!isSafariExtension() && confirm(`Do you want to disconnect all sessions?`) === false)
      return

    for (const session of Option.wrap(maybeTempSessions).getOr([]))
      await background.requestOrThrow({
        method: "brume_disconnect",
        params: [session.id]
      }).then(r => r.getOrThrow())

    for (const session of Option.wrap(maybePersSessions).getOr([]))
      await background.requestOrThrow({
        method: "brume_disconnect",
        params: [session.id]
      }).then(r => r.getOrThrow())

    return
  }), [background, maybePersSessions])

  return <UserPage>
    <PageHeader title={Locale.get(Locale.Sessions, lang)}>
      <PaddedRoundedClickableNakedButton
        disabled={disconnectAllOrAlert.loading || !length}
        onClick={disconnectAllOrAlert.run}>
        <Outline.TrashIcon className="size-5" />
      </PaddedRoundedClickableNakedButton>
    </PageHeader>
    <div className="po-2 flex items-center">
      <div className="text-default-contrast">
        {`Sessions allow you to connect to applications. These applications can then make requests for you to approve.`}
      </div>
    </div>
    <UserGuardBody>
      <SessionsBody />
    </UserGuardBody>
  </UserPage>
}

export function SessionsBody() {
  const tempSessionsQuery = useTemporarySessions()
  const maybeTempSessions = tempSessionsQuery.data?.get()

  const persSessionsQuery = usePersistentSessions()
  const maybePersSessions = persSessionsQuery.data?.get()

  return <PageBody>
    <div className="flex flex-col gap-2">
      {maybeTempSessions?.map(session =>
        <Fragment key={session.id}>
          <SessionRow session={session} />
        </Fragment>)}
      {maybePersSessions?.map(session =>
        <Fragment key={session.id}>
          <SessionRow session={session} />
        </Fragment>)}
    </div>
  </PageBody>
}
export function SessionRow(props: { session: Session }) {
  const { session } = props
  const path = usePathContext().getOrThrow()

  const subpath = useHashSubpath(path)
  const menu = useCoords(subpath, `/${session.id}/menu`)

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

  return <div role="button" className="po-2 rounded-xl flex items-center gap-4"
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
      <Fragment key={x.id}>
        <IndexedBlobbyLoader
          index={i}
          id={x.id}
          ok={onIconData} />
      </Fragment>)}
    <div className="relative flex-none">
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
      <div className="text-default-contrast">
        {maybeOriginData.origin}
      </div>
    </div>
    <PaddedRoundedClickableNakedAnchor>
      <Outline.EllipsisVerticalIcon className="size-5" />
    </PaddedRoundedClickableNakedAnchor>
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
  const path = usePathContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const chains = useCoords(path, `/${sessionData.id}/chains`)

  const disconnectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_disconnect",
      params: [sessionData.id]
    }).then(r => r.getOrThrow())
  }), [background, sessionData])

  return <div className="flex flex-col text-left gap-2 w-[160px] overflow-x-hidden">
    {sessionData.type !== "wc" &&
      <WideClickableNakedMenuAnchor
        onClick={chains.onClick}
        onKeyDown={chains.onKeyDown}
        href={chains.href}>
        <Outline.LinkIcon className="flex-none size-4" />
        <div className="truncate">
          {sessionData.chain.name}
        </div>
      </WideClickableNakedMenuAnchor>}
    <WideClickableNakedMenuButton
      disabled={disconnectOrAlert.loading}
      onClick={disconnectOrAlert.run}>
      <Outline.XMarkIcon className="size-4" />
      Disconnect
    </WideClickableNakedMenuButton>
  </div>
}

export function ChainsMenu(props: { sessionData: ExSessionData }) {
  const { sessionData } = props

  return <div className="flex flex-col text-left gap-2 w-[160px] overflow-x-hidden">
    {Object.values(chainDataByChainId).map(chain =>
      <Fragment key={chain.chainId}>
        <ChainRow
          sessionData={sessionData}
          chainData={chain} />
      </Fragment>)}
  </div>
}

export function ChainRow(props: { sessionData: ExSessionData, chainData: ChainData }) {
  const { sessionData, chainData } = props
  const close = useCloseContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const switchOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_switchEthereumChain",
      params: [sessionData.id, chainData.chainId]
    }).then(r => r.getOrThrow())

    close()
  }), [background, sessionData, chainData, close])

  return <WideClickableNakedMenuButton
    disabled={switchOrAlert.loading}
    onClick={switchOrAlert.run}>
    {sessionData.chain.chainId === chainData.chainId &&
      <Outline.CheckIcon className="flex-none size-4" />}
    <div className="truncate">
      {chainData.name}
    </div>
  </WideClickableNakedMenuButton>
}