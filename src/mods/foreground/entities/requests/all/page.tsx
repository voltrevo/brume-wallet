/* eslint-disable @next/next/no-img-element */
import { Errors } from "@/libs/errors"
import { Outline } from "@/libs/icons"
import { isSafariExtension } from "@/libs/platform/platform"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { OkProps } from "@/libs/react/props/promise"
import { UserRejectedError } from "@/libs/rpc/mods/errors"
import { PaddedRoundedClickableNakedButton } from "@/libs/ui/button"
import { ImageWithFallback } from "@/libs/ui/image"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { pathOf, urlOf } from "@/libs/url/url"
import { AppRequest } from "@/mods/background/service_worker/entities/requests/data"
import { useBackgroundContext } from "@/mods/foreground/background/context"
import { useLocaleContext } from "@/mods/foreground/global/mods/locale"
import { Locale } from "@/mods/foreground/locale"
import { UserGuardBody } from "@/mods/foreground/user/mods/guard"
import { BlobbyData } from "@/mods/universal/entities/blobbys"
import { RpcErr } from "@hazae41/jsonrpc"
import { Nullable } from "@hazae41/option"
import { Err } from "@hazae41/result"
import { Fragment, useCallback, useEffect, useState } from "react"
import { useBlobby } from "../../blobbys/data"
import { useOrigin } from "../../origins/data"
import { useAppRequest, useAppRequests } from "../data"

export function RequestsPage() {
  const locale = useLocaleContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const requestsQuery = useAppRequests()
  const maybeRequests = requestsQuery.data?.get()

  const rejectAllOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (maybeRequests == null)
      return
    if (!isSafariExtension() && confirm(`Do you want to reject all requests?`) === false)
      return

    for (const { id } of maybeRequests)
      await background.requestOrThrow({
        method: "brume_respond",
        params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
      }).then(r => r.getOrThrow())

    return
  }), [background, maybeRequests])

  return <UserPage>
    <PageHeader title={Locale.get(Locale.Requests, locale)}>
      <PaddedRoundedClickableNakedButton
        disabled={rejectAllOrAlert.loading || !Boolean(maybeRequests?.length)}
        onClick={rejectAllOrAlert.run}>
        <Outline.TrashIcon className="size-5" />
      </PaddedRoundedClickableNakedButton>
    </PageHeader>
    <div className="po-2 flex items-center">
      <div className="text-default-contrast">
        {Locale.get({
          en: `Requests allow you to approve various actions such as transactions and signatures. These requests are sent by applications through sessions.`,
          zh: `请求允许您批准各种操作，例如交易和签名。这些请求是通过会话由应用程序发送的。`,
          hi: `अनुरोध आपको विभिन्न क्रियाएँ मंजूर करने की अनुमति देते हैं, जैसे लेन-देन और हस्ताक्षर। ये अनुरोध एप्लिकेशन द्वारा सत्रों के माध्यम से भेजे जाते हैं।`,
          es: `Las solicitudes le permiten aprobar varias acciones como transacciones y firmas. Estas solicitudes son enviadas por aplicaciones a través de sesiones.`,
          ar: `تسمح لك الطلبات بالموافقة على مختلف الإجراءات مثل المعاملات والتوقيعات. يتم إرسال هذه الطلبات من التطبيقات من خلال الجلسات.`,
          fr: `Les demandes vous permettent d'approuver diverses actions telles que les transactions et les signatures. Ces demandes sont envoyées par des applications via des sessions.`,
          de: `Anfragen ermöglichen es Ihnen, verschiedene Aktionen wie Transaktionen und Signaturen zu genehmigen. Diese Anfragen werden von Anwendungen über Sitzungen gesendet.`,
          ru: `Запросы позволяют вам утвердить различные действия, такие как транзакции и подписи. Эти запросы отправляются приложениями через сеансы.`,
          pt: `As solicitações permitem que você aprove várias ações, como transações e assinaturas. Essas solicitações são enviadas por aplicativos por meio de sessões.`,
          ja: `リクエストを使用すると、トランザクションや署名などのさまざまなアクションを承認できます。これらのリクエストは、セッションを介してアプリケーションによって送信されます。`,
          pa: `ਬਿਨੈਕ ਕਾਰਵਾਈਆਂ ਜਿਵੇਂ ਲੇਨ-ਦੇਨ ਅਤੇ ਹਸਤਾਖਰਾਂ ਵਗੈਰਾਂ ਨੂੰ ਮੰਜੂਰੀ ਦੇਣ ਦੀ ਆਗਿਆ ਦਿੰਦੀ ਹੈ। ਇਹ ਬਿਨੈਕ ਅਰਜ਼ਾਵਾਂ ਐਪਲੀਕੇਸ਼ਨਾਂ ਦੁਆਰਾ ਸੈਸ਼ਨਾਂ ਦੁਆਰਾ ਭੇਜੀ ਜਾਂਦੀਆਂ ਹਨ।`,
          bn: `অনুরোধ আপনাকে লেনদেন এবং স্বাক্ষর ইত্যাদি বিভিন্ন ক্রিযার অনুমোদন করার অনুমতি দেয়। এই অনুরোধগুলি অ্যাপ্লিকেশনগুলি দ্বারা সেশন মাধ্যমে প্রেরিত হয়।`,
          id: `Permintaan memungkinkan Anda menyetujui berbagai tindakan seperti transaksi dan tanda tangan. Permintaan ini dikirim oleh aplikasi melalui sesi.`,
          ur: `درخواستیں آپ کو مختلف کارروائیوں جیسے لین دین اور دستخط کو منظور کرنے کی اجازت دیتی ہیں۔ یہ درخواستیں اطلاقات کے ذریعہ سیشن کے ذریعہ بھیجی جاتی ہیں۔`,
          ms: `Permintaan membolehkan anda meluluskan pelbagai tindakan seperti transaksi dan tandatangan. Permintaan ini dihantar oleh aplikasi melalui sesi.`,
          it: `Le richieste ti consentono di approvare varie azioni come transazioni e firme. Queste richieste vengono inviate dalle applicazioni tramite sessioni.`,
          tr: `İstekler, işlemler ve imzalar gibi çeşitli eylemleri onaylamanıza olanak tanır. Bu istekler uygulamalar tarafından oturumlar aracılığıyla gönderilir.`,
          ta: `கோரிக்கைகள் நீங்கள் பரிவர்த்தனைகளை அனுமதிக்கும் அத்தியாவசியங்களை அனுமதிக்கும். இந்த கோரிக்கைகள் பயன்பாடுகளால் அனுப்பப்படுகின்றன.`,
          te: `అభ్యర్థనలు మీరు లేదా సంతకాలను అనుమతించడానికి అనేక చర్యలను అనుమతిస్తాయి. ఈ అభ్యర్థనలు అప్లికేషన్లు సెషన్ల ద్వారా పంపబడుతాయి.`,
          ko: `요청을 사용하면 거래 및 서명과 같은 다양한 작업을 승인할 수 있습니다. 이러한 요청은 세션을 통해 응용 프로그램에서 보냅니다.`,
          vi: `Yêu cầu cho phép bạn phê duyệt các hành động khác nhau như giao dịch và chữ ký. Những yêu cầu này được ứng dụng gửi qua các phiên.`,
          pl: `Żądania pozwalają na zatwierdzanie różnych działań, takich jak transakcje i podpisy. Te żądania są wysyłane przez aplikacje za pośrednictwem sesji.`,
          ro: `Cererile vă permit să aprobați diverse acțiuni, cum ar fi tranzacțiile și semnăturile. Aceste cereri sunt trimise de aplicații prin sesiuni.`,
          nl: `Verzoeken stellen u in staat verschillende acties goed te keuren, zoals transacties en handtekeningen. Deze verzoeken worden door applicaties verzonden via sessies.`,
          el: `Οι αιτήσεις σάς επιτρέπουν να εγκρίνετε διάφορες ενέργειες, όπως συναλλαγές και υπογραφές. Αυτά τα αιτήματα στέλνονται από εφαρμογές μέσω συνεδριών.`,
          th: `คำขอช่วยให้คุณอนุมัติการดำเนินการต่าง ๆ เช่น ธุรกรรมและลายเซ็น คำขอเหล่านี้ถูกส่งโดยแอปพลิเคชันผ่านเซสชัน`,
          cs: `Žádosti vám umožňují schvalovat různé akce, jako jsou transakce a podpisy. Tyto žádosti jsou odesílány aplikacemi prostřednictvím relací.`,
          hu: `A kérések lehetővé teszik különféle műveletek jóváhagyását, például tranzakciók és aláírások. Ezeket a kéréseket az alkalmazások küldik át a munkameneteken keresztül.`,
          sv: `Begäranden låter dig godkänna olika åtgärder som transaktioner och signaturer. Dessa begäranden skickas av applikationer via sessioner.`,
          da: `Anmodninger giver dig mulighed for at godkende forskellige handlinger som transaktioner og underskrifter. Disse anmodninger sendes af applikationer gennem sessioner.`,
        }, locale)}
      </div>
    </div>
    <UserGuardBody>
      <RequestsBody />
    </UserGuardBody>
  </UserPage>
}

export function RequestsBody() {
  const requestsQuery = useAppRequests()
  const maybeRequests = requestsQuery.data?.get()

  return <PageBody>
    <div className="flex flex-col gap-2">
      {maybeRequests?.map(request =>
        <Fragment key={request.id}>
          <RequestRow request={request} />
        </Fragment>)}
    </div>
  </PageBody>
}

export function RequestRow(props: { request: AppRequest }) {
  const requestQuery = useAppRequest(props.request.id)
  const maybeRequestData = requestQuery.data?.get()

  const originQuery = useOrigin(maybeRequestData?.origin)
  const maybeOriginData = originQuery.data?.get()

  const [iconDatas, setIconDatas] = useState<Nullable<BlobbyData>[]>([])

  const onIconData = useCallback(([index, data]: [number, Nullable<BlobbyData>]) => {
    setIconDatas(iconDatas => {
      iconDatas[index] = data
      return [...iconDatas]
    })
  }, [])

  if (maybeRequestData == null)
    return null
  if (maybeOriginData == null)
    return null

  const { id, method, params } = maybeRequestData

  return <a className="po-2 rounded-xl flex items-center gap-4"
    href={`#${pathOf(urlOf(`/${method}?id=${id}`, params))}`}>
    {maybeOriginData.icons?.map((x, i) =>
      <Fragment key={x.id}>
        <IndexedBlobbyLoader
          index={i}
          id={x.id}
          ok={onIconData} />
      </Fragment>)}
    <div className="flex-none">
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
  </a>
}

function IndexedBlobbyLoader(props: OkProps<[number, Nullable<BlobbyData>]> & { id: string, index: number }) {
  const { index, id, ok } = props

  const { data } = useBlobby(id)

  useEffect(() => {
    ok([index, data?.inner])
  }, [index, data, ok])

  return null
}