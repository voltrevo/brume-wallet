/* eslint-disable @next/next/no-img-element */
import { Errors } from "@/libs/errors"
import { ChainData, chainDataByChainId } from "@/libs/ethereum/mods/chain"
import { Outline } from "@/libs/icons"
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
  const locale = useLocaleContext().getOrThrow()
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
    <PageHeader title={Locale.get(Locale.Sessions, locale)}>
      <PaddedRoundedClickableNakedButton
        disabled={disconnectAllOrAlert.loading || !length}
        onClick={disconnectAllOrAlert.run}>
        <Outline.TrashIcon className="size-5" />
      </PaddedRoundedClickableNakedButton>
    </PageHeader>
    <div className="po-2 flex items-center">
      <div className="text-default-contrast">
        {Locale.get({
          en: `Sessions allow you to connect to applications. These apps can then send you requests to approve.`,
          zh: `会话允许您连接到应用程序。然后，这些应用程序可以向您发送请求以供批准。`,
          hi: `सत्र आपको एप्लिकेशन से कनेक्ट करने की अनुमति देते हैं। ये ऐप्स फिर आपसे मंजूरी के लिए अनुरोध भेज सकते हैं।`,
          es: `Las sesiones le permiten conectarse a aplicaciones. Estas aplicaciones pueden enviarle solicitudes para aprobar.`,
          ar: `الجلسات تتيح لك الاتصال بالتطبيقات. يمكن لهذه التطبيقات بعد ذلك إرسال طلبات لك للموافقة عليها.`,
          fr: `Les sessions vous permettent de vous connecter à des applications. Ces applications peuvent ensuite vous envoyer des demandes à approuver.`,
          de: `Sitzungen ermöglichen es Ihnen, sich mit Anwendungen zu verbinden. Diese Apps können Ihnen dann Anfragen senden, die Sie genehmigen können.`,
          ru: `Сеансы позволяют вам подключаться к приложениям. Затем эти приложения могут отправлять вам запросы на утверждение.`,
          pt: `As sessões permitem que você se conecte a aplicativos. Esses aplicativos podem então enviar-lhe pedidos para aprovar.`,
          ja: `セッションを使用すると、アプリケーションに接続できます。これらのアプリは、その後、承認するためのリクエストを送信できます。`,
          pa: `ਸੈਸ਼ਨ ਤੁਹਾਨੂੰ ਐਪਲੀਕੇਸਾਂ ਨਾਲ ਕੁਨੈਕਟ ਕਰਨ ਦੀ ਆਗਿਆ ਦਿੰਦੇ ਹਨ। ਇਹ ਐਪਸ ਫਿਰ ਤੁਹਾਨੂੰ ਮੰਜੂਰੀ ਦੇ ਲਈ ਬੇਨਤੀ ਭੇਜ ਸਕਦੇ ਹਨ।`,
          bn: `সেশনগুলি আপনাকে অ্যাপ্লিকেশনগুলার সাথে সংযোগ করার অনুমতি দেয়। এই অ্যাপগুলি তারপরে আপনাকে অনুমোদনের জন্য অনুরোধ প্রেরণ করতে পারে।`,
          id: `Sesi memungkinkan Anda terhubung ke aplikasi. Aplikasi ini kemudian dapat mengirimkan permintaan kepada Anda untuk menyetujui.`,
          ur: `سیشن آپ کو ایپلیکیشنز سے منسلک ہونے کی اجازت دیتے ہیں۔ پھر یہ ایپس آپ کو منظوری کے لیے درخواست بھیج سکتے ہیں۔`,
          ms: `Sesi membolehkan anda menyambung ke aplikasi. Aplikasi ini kemudian boleh menghantar permintaan kepada anda untuk diluluskan.`,
          it: `Le sessioni ti consentono di connetterti alle applicazioni. Queste app possono quindi inviarti richieste da approvare.`,
          tr: `Oturumlar, uygulamalara bağlanmanıza olanak tanır. Bu uygulamalar daha sonra onaylamanız için size istekler gönderebilir.`,
          ta: `அமர்வுகளுக்கு உங்களை இணைக்க அனுமதிக்கும் அமர்வுகள். இந்த பயன்பாடுகள் பின்னர் உங்களுக்கு அனுமோனம் கேட்க கோரிக்கைகளை அனுப்பலாம்.`,
          te: `సెషన్లు మీరు అప్లికేషన్లతో కనెక్ట్ అవుటుకు అనుమతిస్తాయి. ఈ యాప్స్ తరువాట మీకు అనుమోదన కోసం అభ్యర్థనలను పంపవచ్చు.`,
          ko: `세션을 사용하면 응용 프로그램에 연결할 수 있습니다. 그런 다음이 응용 프로그램은 승인 요청을 보낼 수 있습니다.`,
          vi: `Các phiên cho phép bạn kết nối với ứng dụng. Những ứng dụng này sau đó có thể gửi yêu cầu cho bạn phê duyệt.`,
          pl: `Sesje pozwalają na połączenie z aplikacjami. Następnie te aplikacje mogą wysłać Ci prośby o zatwierdzenie.`,
          ro: `Sesiunile vă permit să vă conectați la aplicații. Aceste aplicații vă pot trimite apoi cereri de aprobare.`,
          nl: `Sessies stellen u in staat om verbinding te maken met applicaties. Deze apps kunnen u vervolgens verzoeken sturen om goed te keuren.`,
          el: `Οι συνεδρίες σας επιτρέπουν να συνδεθείτε σε εφαρμογές. Αυτές οι εφαρμογές μπορούν στη συνέχεια να σας στείλουν αιτήματα για έγκριση.`,
          th: `เซสชันช่วยให้คุณเชื่อมต่อกับแอปพลิเคชัน แอปพลิเคชันเหล่านี้จึงสามารถส่งคำขอให้คุณอนุมัติ`,
          cs: `Relace vám umožňují připojit se k aplikacím. Tyto aplikace vám pak mohou poslat žádosti o schválení.`,
          hu: `A munkamenetek lehetővé teszik az alkalmazásokhoz való csatlakozást. Ezek az alkalmazások kérhetik az engedélyezését.`,
          sv: `Sessioner låter dig ansluta till appar. Dessa appar kan sedan skicka dig förfrågningar att godkänna.`,
          da: `Sessioner giver dig mulighed for at oprette forbindelse til applikationer. Disse apps kan derefter sende dig anmodninger om godkendelse.`,
        }, locale)}
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

  const hash = useHashSubpath(path)
  const menu = useCoords(hash, `/${session.id}/menu`)

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
      {hash.url.pathname === `/${session.id}/menu` &&
        <Menu>
          <SessionMenu sessionData={maybeSessionData} />
        </Menu>}
      {hash.url.pathname === `/${session.id}/chains` && maybeSessionData.type !== "wc" &&
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
  const locale = useLocaleContext().getOrThrow()
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
      {Locale.get(Locale.Disconnect, locale)}
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