import { browser, BrowserError } from "@/libs/browser/browser";
import { Errors, UIError } from "@/libs/errors/errors";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { UserRejectedError } from "@/libs/rpc/mods/errors";
import { ClickableOppositeAnchor, PaddedRoundedClickableNakedAnchor } from "@/libs/ui/anchor";
import { WideClickableContrastButton, WideClickableOppositeButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastLabel } from "@/libs/ui/label";
import { Menu } from "@/libs/ui/menu";
import { PageBody, PageHeader } from "@/libs/ui/page/header";
import { UserPage } from "@/libs/ui/page/page";
import { urlOf } from "@/libs/url/url";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { useAppRequests } from "@/mods/foreground/entities/requests/data";
import { useSimulation } from "@/mods/foreground/entities/simulations/data";
import { useTransactionTrial, useTransactionWithReceipt } from "@/mods/foreground/entities/transactions/data";
import { WalletTransactionDialog } from "@/mods/foreground/entities/wallets/actions/eth_sendTransaction";
import { SimpleInput, SimpleTextarea } from "@/mods/foreground/entities/wallets/actions/send";
import { WalletCreatorMenu } from "@/mods/foreground/entities/wallets/all/create";
import { ReadonlyWalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create/readonly";
import { StandaloneWalletCreatorDialog } from "@/mods/foreground/entities/wallets/all/create/standalone";
import { SelectableWalletGrid } from "@/mods/foreground/entities/wallets/all/page";
import { WalletDataContext } from "@/mods/foreground/entities/wallets/context";
import { EthereumWalletInstance, useEthereumContext, useWallet, useWallets } from "@/mods/foreground/entities/wallets/data";
import { Director, Localizer, useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { NavBar } from "@/mods/foreground/overlay/navbar";
import { Base16 } from "@hazae41/base16";
import { Bytes } from "@hazae41/bytes";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { Abi } from "@hazae41/cubane";
import { RpcErr, RpcOk } from "@hazae41/jsonrpc";
import { Nullable, Option } from "@hazae41/option";
import { Err, Result } from "@hazae41/result";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

export default function Main() {
  const background = useBackgroundContext().getOrThrow()

  const helloOrThrow = useCallback(async () => {
    await background.requestOrThrow<void>({
      method: "popup_hello"
    }).then(r => r.getOrThrow())
  }, [background])

  useEffect(() => {
    helloOrThrow().catch(console.error)
  }, [helloOrThrow])

  const getHashOrThrow = useCallback(async () => {
    return await background.requestOrThrow<string>({
      method: "brume_getPath"
    }).then(r => r.getOrThrow())
  }, [background])

  const setHashOrThrow = useCallback(async (hash: string) => {
    await background.requestOrThrow<void>({
      method: "brume_setPath",
      params: [hash]
    }).then(r => r.getOrThrow())
  }, [background])

  const [hash, setHash] = useState<string>()

  useEffect(() => {
    const onHashChange = () => setHash(location.hash)
    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    if (hash == null)
      return
    location.hash = hash
  }, [hash])

  const initHashOrThrow = useCallback(async () => {
    if (location.hash && location.hash !== "#/")
      setHash(location.hash)
    else
      setHash(await getHashOrThrow())
  }, [getHashOrThrow])

  useEffect(() => {
    initHashOrThrow().catch(console.error)
  }, [initHashOrThrow])

  useEffect(() => {
    if (hash == null)
      return
    setHashOrThrow(hash).catch(console.error)
  }, [setHashOrThrow, hash])

  const url = useMemo(() => {
    if (hash == null)
      return
    const url = new URL(BrowserError.runOrThrowSync(() => browser!.runtime.getURL("/index.html")))
    url.hash = hash
    return url
  }, [hash])

  const [iframe, setIframe] = useState<Nullable<HTMLIFrameElement>>()

  const subwindow = useMemo(() => {
    if (iframe == null)
      return
    if (iframe.contentWindow == null)
      return
    return iframe.contentWindow
  }, [iframe])

  useEffect(() => {
    if (subwindow == null)
      return
    const onSubwindowHashChange = () => setHash(subwindow.location.hash)
    subwindow.addEventListener("hashchange", onSubwindowHashChange, { passive: true })
    return () => subwindow.removeEventListener("hashchange", onSubwindowHashChange)
  }, [subwindow])

  if (url == null)
    return null

  return <Localizer value={undefined}>
    <Director>
      <main id="root" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
        <NavBar />
        <iframe className="grow w-full"
          ref={setIframe}
          src={url.href}
          seamless />
      </main>
    </Director>
  </Localizer>
}

export function TransactPage() {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const hash = useHashSubpath(path)

  const id = Option.wrap(path.url.searchParams.get("id")).getOrThrow()

  const walletId = Option.wrap(path.url.searchParams.get("walletId")).getOrThrow()
  const walletQuery = useWallet(walletId)
  const maybeWallet = walletQuery.current?.getOrNull()

  const chainId = Option.wrap(path.url.searchParams.get("chainId")).getOrThrow()
  const chainData = Option.wrap(chainDataByChainId[Number(chainId)]).getOrThrow()

  const maybeContext = useEthereumContext(maybeWallet?.uuid, chainData).getOrNull()

  const from = Option.wrap(path.url.searchParams.get("from")).getOrThrow()
  const maybeTo = path.url.searchParams.get("to")
  const maybeGas = path.url.searchParams.get("gas")
  const maybeValue = path.url.searchParams.get("value")
  const maybeNonce = path.url.searchParams.get("nonce")
  const maybeData = path.url.searchParams.get("data")
  const maybeGasPrice = path.url.searchParams.get("gasPrice")
  const maybeMaxFeePerGas = path.url.searchParams.get("maxFeePerGas")
  const maybeMaxPriorityFeePerGas = path.url.searchParams.get("maxPriorityFeePerGas")

  const trialQuery = useTransactionTrial(id)
  const maybeTrialData = trialQuery.current?.getOrNull()

  const transactionQuery = useTransactionWithReceipt(maybeTrialData?.transactions[0].uuid, maybeContext)
  const maybeTransaction = transactionQuery.current?.getOrNull()

  const preTx = useMemo(() => {
    return {
      from: from,
      to: maybeTo,
      gas: maybeGas,
      value: maybeValue,
      data: maybeData,
      nonce: maybeNonce,
      gasPrice: maybeGasPrice,
      maxFeePerGas: maybeMaxFeePerGas,
      maxPriorityFeePerGas: maybeMaxPriorityFeePerGas
    }
  }, [from, maybeTo, maybeValue, maybeNonce, maybeData, maybeGas, maybeGasPrice, maybeMaxFeePerGas, maybeMaxPriorityFeePerGas])

  const simulationQuery = useSimulation(preTx, "latest", maybeContext)
  const currentSimulation = simulationQuery.current

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const transaction = Option.wrap(maybeTransaction).getOrThrow()

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, transaction.hash)]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path, maybeTransaction])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path])

  const onSendTransactionClick = useCallback(() => {
    location.replace(hash.go(urlOf("/eth_sendTransaction", { trial: id, chain: chainId, target: maybeTo, value: maybeValue, nonce: maybeNonce, data: maybeData, gas: maybeGas, gasMode: "custom", gasPrice: maybeGasPrice, maxFeePerGas: maybeMaxFeePerGas, maxPriorityFeePerGas: maybeMaxPriorityFeePerGas, disableData: true, disableSign: true })))
  }, [hash, id, chainId, maybeTo, maybeValue, maybeNonce, maybeData, maybeGas, maybeGasPrice, maybeMaxFeePerGas, maybeMaxPriorityFeePerGas])

  useEffect(() => {
    if (maybeTransaction == null)
      return
    approveOrAlert.run()
  }, [maybeTransaction, approveOrAlert])

  return <WalletDataContext value={maybeWallet}>
    <UserPage>
      <HashSubpathProvider>
        {hash.url.pathname === "/eth_sendTransaction" &&
          <Dialog>
            <WalletTransactionDialog />
          </Dialog>}
      </HashSubpathProvider>
      <PageBody>
        <Dialog.Title>
          {Locale.get(Locale.TransactionRequest, locale)}
        </Dialog.Title>
        <div className="h-2" />
        <div className="text-default-contrast">
          {Locale.get({
            en: "Do you want to send the following transaction?",
            zh: "您是否要发送以下交易？",
            hi: "क्या आप निम्नलिखित लेन-देन भेजना चाहते हैं?",
            es: "¿Quieres enviar la siguiente transacción?",
            ar: "هل تريد إرسال المعاملة التالية؟",
            fr: "Voulez-vous envoyer la transaction suivante ?",
            de: "Möchten Sie die folgende Transaktion senden?",
            ru: "Хотите отправить следующую транзакцию?",
            pt: "Quer enviar a seguinte transação?",
            ja: "次のトランザクションを送信しますか？",
            pa: "ਕੀ ਤੁਸੀਂ ਹੇਠਾਂ ਦੀ ਲੇਨ-ਦੇਨ ਭੇਜਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
            bn: "আপনি কি নিম্নলিখিত লেনদেন পাঠাতে চান?",
            id: "Apakah Anda ingin mengirim transaksi berikut?",
            ur: "کیا آپ مندرجہ ذیل لین دین بھیجنا چاہتے ہیں؟",
            ms: "Adakah anda ingin menghantar transaksi berikut?",
            it: "Vuoi inviare la seguente transazione?",
            tr: "Aşağıdaki işlemi göndermek ister misiniz?",
            ta: "கீழே உள்ள பரிவர்த்தனையை அனுப்ப வேண்டுமா?",
            te: "క్రింది లేనిదానిని పంపాలా?",
            ko: "다음 거래를 보내시겠습니까?",
            vi: "Bạn có muốn gửi giao dịch sau?",
            pl: "Czy chcesz wysłać następną transakcję?",
            ro: "Doriți să trimiteți următoarea tranzacție?",
            nl: "Wilt u de volgende transactie verzenden?",
            el: "Θέλετε να στείλετε την ακόλουθη συναλλαγή;",
            th: "คุณต้องการส่งธุรกรรมต่อไปหรือไม่?",
            cs: "Chcete odeslat následující transakci?",
            hu: "Szeretné elküldeni a következő tranzakciót?",
            sv: "Vill du skicka följande transaktion?",
            da: "Vil du sende følgende transaktion?",
          }, locale)}
        </div>
        <div className="h-4" />
        <div className="font-medium">
          {Locale.get(Locale.Transaction, locale)}
        </div>
        {preTx.from && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              {Locale.get(Locale.Sender, locale)}
            </div>
            <div className="w-4" />
            <SimpleInput
              readOnly
              value={preTx.from} />
          </ContrastLabel>
        </>}
        {preTx.to && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              {Locale.get(Locale.Recipient, locale)}
            </div>
            <div className="w-4" />
            <SimpleInput
              readOnly
              value={preTx.to} />
          </ContrastLabel>
        </>}
        {preTx.value && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              {Locale.get(Locale.Amount, locale)}
            </div>
            <div className="w-4" />
            <SimpleInput
              readOnly
              value={preTx.value} />
          </ContrastLabel>
        </>}
        {preTx.nonce && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              {Locale.get(Locale.Number, locale)}
            </div>
            <div className="w-4" />
            <SimpleInput
              readOnly
              value={preTx.nonce} />
          </ContrastLabel>
        </>}
        {preTx.data && <>
          <div className="h-2" />
          <ContrastLabel>
            <div className="flex-none">
              {Locale.get(Locale.Data, locale)}
            </div>
            <div className="w-4" />
            <SimpleTextarea
              readOnly
              rows={3}
              value={preTx.data} />
          </ContrastLabel>
        </>}
        <div className="h-4" />
        <div className="font-medium">
          {Locale.get(Locale.Simulation, locale)}
        </div>
        <div className="text-default-contrast">
          {Locale.get({
            en: "The simulation logs are a preview of the transaction execution on the blockchain.",
            zh: "模拟日志是对区块链上的交易执行的预览。",
            hi: "सिमुलेशन लॉग्स ब्लॉकचेन पर लेन-देन के निष्पादन का पूर्वावलोकन है।",
            es: "Los registros de simulación son una vista previa de la ejecución de la transacción en la cadena de bloques.",
            ar: "سجلات المحاكاة هي معاينة لتنفيذ المعاملة على سلسلة الكتل.",
            fr: "Les journaux de simulation sont un aperçu de l'exécution de la transaction sur la blockchain.",
            de: "Die Simulation protokolliert eine Vorschau der Transaktionsausführung auf der Blockchain.",
            ru: "Журналы симуляции - это предварительный просмотр выполнения транзакции на блокчейне.",
            pt: "Os logs de simulação são uma prévia da execução da transação na blockchain.",
            ja: "シミュレーションログは、ブロックチェーン上でのトランザクションの実行のプレビューです。",
            pa: "ਸਿਮੂਲੇਸ਼ਨ ਲਾਗਾਂ ਬਲਾਕਚੈਨ 'ਤੇ ਲੇਨ-ਦੇਨ ਦੇ ਨਿ਷ਪਾਦਨ ਦਾ ਇਕ ਝਲਕ ਹੈ।",
            bn: "সিমুলেশন লগগুলি ব্লকচেনে লেনদেনের পূর্বাদর্শন।",
            id: "Log simulasi adalah pratinjau dari eksekusi transaksi di blockchain.",
            ur: "سمیولیشن لاگز بلاک چین پر لین دین کے انجام کی پیش نظر ہیں۔",
            ms: "Log simulasi adalah pratonton pelaksanaan transaksi di blockchain.",
            it: "I log della simulazione sono un'anteprima dell'esecuzione della transazione sulla blockchain.",
            tr: "Simülasyon günlükleri, blok zincirindeki işlemin önizlemesidir.",
            ta: "சிமுலேஷன் பதிவுகள் தரவுக்கான பூர்வப்பார்வையாக தொடர்புடையது.",
            te: "సిమ్యులేషన్ లాగ్‌లు బ్లాక్‌చైన్‌లో లేనిదానం పూర్వదర్శనం.",
            ko: "시뮬레이션 로그는 블록체인에서 거래 실행의 미리보기입니다.",
            vi: "Nhật ký mô phỏng là bản xem trước của việc thực thi giao dịch trên blockchain.",
            pl: "Logi symulacji to podgląd wykonania transakcji na blockchainie.",
            ro: "Jurnalele de simulare sunt o previzualizare a execuției tranzacției pe blockchain.",
            nl: "De simulatielogs zijn een voorbeeld van de transactie-uitvoering op de blockchain.",
            el: "Τα logs προσομοίωσης είναι μια προεπισκόπηση της εκτέλεσης της συναλλαγής στην αλυσίδα μπλοκ.",
            th: "บันทึกการจำลองเป็นการดูตัวอย่างของการดำเนินการธุรกรรมบนบล็อกเชน",
            cs: "Simulační záznamy jsou náhledem na provedení transakce na blockchainu.",
            hu: "A szimulációs naplók a tranzakció végrehajtásának előnézete a blokkláncon.",
            sv: "Simuleringsloggar är en förhandsgranskning av transaktionsexekveringen på blockkedjan.",
            da: "Simulationslogfiler er en forhåndsvisning af transaktionsekskveringen på blockchain.",
          }, locale)}
        </div>
        <div className="h-2" />
        {currentSimulation == null &&
          <div className="text-default-contrast">
            {Locale.get(Locale.Loading, locale)}...
          </div>}
        {currentSimulation?.isErr() &&
          <div className="text-red-400 dark:text-red-500">
            {currentSimulation.getErr().message}
          </div>}
        {currentSimulation?.isOk() &&
          <div className="flex flex-col gap-2">
            {currentSimulation.get().logs.map((log, i) =>
              <Fragment key={i}>
                <div className="p-2 bg-default-contrast rounded-xl">
                  <div className="font-medium">
                    {log.name}
                  </div>
                  <div className="text-default-contrast truncate">
                    {log.raw.address}
                  </div>
                  <div className="h-2" />
                  <div className="flex flex-col gap-2">
                    {log.inputs.map((input, j) =>
                      <Fragment key={j}>
                        <div className="p-2 bg-default-contrast rounded-xl">
                          <div className="font-medium">
                            {input.name} {input.type}
                          </div>
                          <div className="text-default-contrast truncate">
                            {typeof input.value === "string" ? input.value : JSON.stringify(input.value)}
                          </div>
                        </div>
                      </Fragment>)}
                  </div>
                </div>
              </Fragment>)}
          </div>}
        <div className="h-4 grow" />
        <div className="flex items-center flex-wrap-reverse gap-2">
          <WideClickableContrastButton
            onClick={rejectOrAlert.run}
            disabled={rejectOrAlert.loading}>
            <Outline.XMarkIcon className="size-5" />
            {Locale.get(Locale.Reject, locale)}
          </WideClickableContrastButton>
          <WideClickableOppositeButton
            onClick={onSendTransactionClick}>
            <Outline.CheckIcon className="size-5" />
            {Locale.get(Locale.Approve, locale)}
          </WideClickableOppositeButton>
        </div>
      </PageBody>
    </UserPage>
  </WalletDataContext>
}

export function PersonalSignPage() {
  const locale = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const id = Option.wrap(path.url.searchParams.get("id")).getOrThrow()

  const walletId = Option.wrap(path.url.searchParams.get("walletId")).getOrThrow()
  const walletQuery = useWallet(walletId)
  const maybeWallet = walletQuery.current?.getOrNull()

  const message = Option.wrap(path.url.searchParams.get("message")).getOrThrow()

  const triedUserMessage = useMemo(() => Result.runAndWrapSync(() => {
    if (!message.startsWith("0x"))
      return message

    using memory = Base16.get().getOrThrow().padStartAndDecodeOrThrow(message.slice(2))

    return Bytes.toUtf8(memory.bytes)
  }), [message])

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const wallet = Option.wrap(maybeWallet).getOrThrow()
    const message = triedUserMessage.getOrThrow()

    const instance = await EthereumWalletInstance.createOrThrow(wallet, background)
    const signature = await instance.signPersonalMessageOrThrow(message, background)

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, signature)]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path, maybeWallet, triedUserMessage])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path])

  return <UserPage>
    <PageBody>
      <Dialog.Title>
        {Locale.get(Locale.SignatureRequest, locale)}
      </Dialog.Title>
      <div className="h-2" />
      <div className="text-default-contrast">
        {Locale.get({
          en: "Do you want to sign the following message?",
          zh: "您是否要签署以下消息？",
          hi: "क्या आप निम्नलिखित संदेश के लिए हस्ताक्षर करना चाहते हैं?",
          es: "¿Quieres firmar el siguiente mensaje?",
          ar: "هل تريد توقيع الرسالة التالية؟",
          fr: "Voulez-vous signer le message suivant ?",
          de: "Möchten Sie die folgende Nachricht signieren?",
          ru: "Хотите подписать следующее сообщение?",
          pt: "Quer assinar a seguinte mensagem?",
          ja: "次のメッセージに署名しますか？",
          pa: "ਕੀ ਤੁਸੀਂ ਹੇਠਾਂ ਦਿੱਤੇ ਸੁਨੇਹੇ ਲਈ ਹਸਤਾਖਰੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
          bn: "আপনি কি নিম্নলিখিত বার্তার জন্য স্বাক্ষর করতে চান?",
          id: "Apakah Anda ingin menandatangani pesan berikut?",
          ur: "کیا آپ مندرجہ ذیل پیغام کے لیے دستخط کرنا چاہتے ہیں؟",
          ms: "Adakah anda ingin menandatangani mesej berikut?",
          it: "Vuoi firmare il seguente messaggio?",
          tr: "Aşağıdaki mesajı imzalamak ister misiniz?",
          ta: "கீழே உள்ள செய்தியை உத்தியை செய்ய வேண்டுமா?",
          te: "క్రింది సందేశాన్ని సైన్ చేయాలా?",
          ko: "다음 메시지에 서명 하시겠습니까?",
          vi: "Bạn có muốn ký vào thông điệp sau?",
          pl: "Czy chcesz podpisać następującą wiadomość?",
          ro: "Doriți să semnați mesajul următor?",
          nl: "Wilt u het volgende bericht ondertekenen?",
          el: "Θέλετε να υπογράψετε το ακόλουθο μήνυμα;",
          th: "คุณต้องการลงลายมือชื่อในข้อความต่อไปหรือไม่?",
          cs: "Chcete podepsat následující zprávu?",
          hu: "Szeretné aláírni a következő üzenetet?",
          sv: "Vill du signera följande meddelande?",
          da: "Vil du underskrive følgende besked?",
        }, locale)}
      </div>
      <div className="h-2" />
      <div className="text-default-contrast">
        {Locale.get({
          en: "Some applications may ask you to sign a message to prove you own a specific address or to approve a specific action without doing a transaction.",
          zh: "一些应用程序可能会要求您签署一条消息，以证明您拥有特定地址或批准特定操作而无需进行交易。",
          hi: "कुछ एप्लिकेशन आपसे किसी विशेष पते के मालिक होने का सबूत देने या एक विशेष क्रिया को स्वीकृत करने के लिए एक संदेश पर हस्ताक्षर करने के लिए कह सकते हैं।",
          es: "Algunas aplicaciones pueden pedirte que firmes un mensaje para demostrar que eres el propietario de una dirección específica o para aprobar una acción específica sin realizar una transacción.",
          ar: "قد تطلب بعض التطبيقات منك توقيع رسالة لإثبات ملكك لعنوان معين أو للموافقة على إجراء معين دون إجراء معاملة.",
          fr: "Certaines applications peuvent vous demander de signer un message pour prouver que vous êtes le propriétaire d'une adresse spécifique ou pour approuver une action spécifique sans effectuer de transaction.",
          de: "Einige Anwendungen können Sie bitten, eine Nachricht zu signieren, um zu beweisen, dass Sie eine bestimmte Adresse besitzen oder eine bestimmte Aktion ohne Transaktion zu genehmigen.",
          ru: "Некоторые приложения могут попросить вас подписать сообщение, чтобы доказать, что вы владеете определенным адресом или одобрить определенное действие без выполнения транзакции.",
          pt: "Alguns aplicativos podem solicitar que você assine uma mensagem para provar que você é o proprietário de um endereço específico ou para aprovar uma ação específica sem fazer uma transação.",
          ja: "一部のアプリケーションは、トランザクションを行わずに特定のアクションを承認するために、特定のアドレスの所有権を証明するためにメッセージに署名するよう求める場合があります。",
          pa: "ਕੁਝ ਐਪਲੀਕੇਸ਼ਨ ਤੁਹਾਨੂੰ ਇੱਕ ਖਾਸ ਐਡਰੈੱਸ ਦਾ ਮਾਲਕ ਹੋਣ ਦਾ ਸਬੂਤ ਦੇਣ ਜਾਂ ਇੱਕ ਖਾਸ ਕਾਰਵਾਈ ਦੀ ਪ੍ਰਮਾਣਿਤੀ ਲਈ ਇੱਕ ਸੁਨੇਹਾ ਦੇ ਹਸਤਾਕ਷ਰ ਕਰਨ ਲਈ ਕਹ ਸਕਦੇ ਹਨ।",
          bn: "কিছু অ্যাপ্লিকেশন আপনাকে একটি বিশেষ ঠিকানার মালিকানা প্রমাণ করতে বা কোনও লেনদেন না করে একটি বিশেষ ক্রিয়া অনুমোদন করতে একটি বার্তা সাইন করার জন্য অনুরোধ করতে পারে।",
          id: "Beberapa aplikasi mungkin meminta Anda menandatangani pesan untuk membuktikan bahwa Anda memiliki alamat tertentu atau menyetujui tindakan tertentu tanpa melakukan transaksi.",
          ur: "کچھ ایپلیکیشن آپ سے کسی خاص پتے کے مالک ہونے کا ثبوت دینے یا کسی خاص عمل کو منظور کرنے کے لئے بغیر کسی ٹرانزیکشن کے ایک پیغام پر دستخط کرنے کے لئے کہ سکتی ہیں۔",
          ms: "Beberapa aplikasi mungkin meminta anda menandatangani mesej untuk membuktikan bahawa anda memiliki alamat tertentu atau meluluskan tindakan tertentu tanpa melakukan transaksi.",
          it: "Alcune applicazioni potrebbero chiederti di firmare un messaggio per dimostrare di essere il proprietario di un indirizzo specifico o per approvare un'azione specifica senza effettuare una transazione.",
          tr: "Bazı uygulamalar, belirli bir adresin sahibi olduğunuzu kanıtlamak veya bir işlem yapmadan belirli bir eylemi onaylamak için bir mesajı imzalamanızı isteyebilir.",
          ta: "சில பயன்பாடுகள் நீங்கள் குறிப்பிட்ட முகவரியை உங்களை உரிமையாளராக்க அல்லது ஒரு பரிவர்த்தனையை ஒரு பரிவர்த்தனையை செய்யாது ஒரு குறிப்பிட்ட செய்தியை உத்தியை செய்ய கேளும்.",
          te: "కొన్ని అనువర్తనాలు మీకు నిర్దిష్ట చిరునామాను నిర్వహించడానికి లేదా లేనిదానం చేయడానికి ఒక సందేశాన్ని సైన్ చేయడానికి మీరు అడిగిన ఉద్దేశం ఉంటుంది.",
          ko: "일부 응용 프로그램에서는 특정 주소의 소유권을 증명하거나 거래를 수행하지 않고 특정 작업을 승인하기 위해 메시지에 서명하도록 요청할 수 있습니다.",
          vi: "Một số ứng dụng có thể yêu cầu bạn ký vào một thông điệp để chứng minh bạn sở hữu một địa chỉ cụ thể hoặc phê duyệt một hành động cụ thể mà không cần thực hiện giao dịch.",
          pl: "Niektóre aplikacje mogą poprosić Cię o podpisanie wiadomości, aby udowodnić, że jesteś właścicielem określonego adresu lub zatwierdzić określoną akcję bez dokonywania transakcji.",
          ro: "Unele aplicații vă pot cere să semnați un mesaj pentru a dovedi că sunteți proprietarul unei anumite adrese sau pentru a aproba o acțiune specifică fără a face o tranzacție.",
          nl: "Sommige toepassingen kunnen u vragen een bericht te ondertekenen om te bewijzen dat u eigenaar bent van een specifiek adres of om een specifieke actie goed te keuren zonder een transactie uit te voeren.",
          el: "Κάποιες εφαρμογές μπορεί να σας ζητήσουν να υπογράψετε ένα μήνυμα για να αποδείξετε ότι είστε κάτοχος μιας συγκεκριμένης διεύθυνσης ή να εγκρίνετε μια συγκεκριμένη ενέργεια χωρίς να κάνετε μια συναλλαγή.",
          th: "แอปพลิเคชันบางแอปพลิเคชันอาจขอให้คุณเซ็นเอกสารเพื่อพิสูจน์ว่าคุณเป็นเจ้าของที่อยู่เฉพาะหรืออนุมัติการกระทำเฉพาะโดยไม่ต้องดำเนินการธุรกรรม",
          cs: "Některé aplikace vás mohou požádat, abyste podepsali zprávu, abyste prokázali, že vlastníte konkrétní adresu, nebo abyste schválili konkrétní akci bez provedení transakce.",
          hu: "Néhány alkalmazás kérheti, hogy írjon alá egy üzenetet annak bizonyítására, hogy Ön birtokol egy adott címet, vagy hogy jóváhagy egy adott műveletet anélkül, hogy tranzakciót hajtana végre.",
          sv: "Vissa applikationer kan be dig att signera ett meddelande för att bevisa att du äger en specifik adress eller för att godkänna en specifik åtgärd utan att göra en transaktion.",
          da: "Nogle applikationer kan bede dig om at underskrive en besked for at bevise, at du ejer en specifik adresse eller for at godkende en specifik handling uden at udføre en transaktion.",
        }, locale)}
      </div>
      <div className="h-4" />
      <div className="grow p-4 bg-default-contrast rounded-xl whitespace-pre-wrap break-words">
        {triedUserMessage.getOr("Could not decode message")}
      </div>
      <div className="h-4 grow" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableContrastButton
          onClick={rejectOrAlert.run}
          disabled={rejectOrAlert.loading}>
          <Outline.XMarkIcon className="size-5" />
          {Locale.get(Locale.Reject, locale)}
        </WideClickableContrastButton>
        <WideClickableOppositeButton
          onClick={approveOrAlert.run}
          disabled={approveOrAlert.loading}>
          <Outline.CheckIcon className="size-5" />
          {Locale.get(Locale.Approve, locale)}
        </WideClickableOppositeButton>
      </div>
    </PageBody>
  </UserPage>
}

export function TypedSignPage() {
  const locale = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const id = Option.wrap(path.url.searchParams.get("id")).getOrThrow()

  const walletId = Option.wrap(path.url.searchParams.get("walletId")).getOrThrow()
  const walletQuery = useWallet(walletId)
  const maybeWallet = walletQuery.current?.getOrNull()

  const data = Option.wrap(path.url.searchParams.get("data")).getOrThrow()

  const triedParsedData = useMemo(() => Result.runAndWrapSync(() => {
    return JSON.parse(data) as Abi.Typed.TypedData // TODO: guard
  }), [data])

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const wallet = Option.wrap(maybeWallet).getOrThrow()
    const data = triedParsedData.getOrThrow()

    const instance = await EthereumWalletInstance.createOrThrow(wallet, background)
    const signature = await instance.signEIP712HashedMessageOrThrow(data, background)

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, signature)]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path, maybeWallet, triedParsedData])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path])

  return <UserPage>
    <PageBody>
      <Dialog.Title>
        {Locale.get(Locale.SignatureRequest, locale)}
      </Dialog.Title>
      <div className="h-2" />
      <div className="text-default-contrast">
        {Locale.get({
          en: "Do you want to sign the following message?",
          zh: "您是否要签署以下消息？",
          hi: "क्या आप निम्नलिखित संदेश के लिए हस्ताक्षर करना चाहते हैं?",
          es: "¿Quieres firmar el siguiente mensaje?",
          ar: "هل تريد توقيع الرسالة التالية؟",
          fr: "Voulez-vous signer le message suivant ?",
          de: "Möchten Sie die folgende Nachricht signieren?",
          ru: "Хотите подписать следующее сообщение?",
          pt: "Quer assinar a seguinte mensagem?",
          ja: "次のメッセージに署名しますか？",
          pa: "ਕੀ ਤੁਸੀਂ ਹੇਠਾਂ ਦਿੱਤੇ ਸੁਨੇਹੇ ਲਈ ਹਸਤਾਖਰੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
          bn: "আপনি কি নিম্নলিখিত বার্তার জন্য স্বাক্ষর করতে চান?",
          id: "Apakah Anda ingin menandatangani pesan berikut?",
          ur: "کیا آپ مندرجہ ذیل پیغام کے لیے دستخط کرنا چاہتے ہیں؟",
          ms: "Adakah anda ingin menandatangani mesej berikut?",
          it: "Vuoi firmare il seguente messaggio?",
          tr: "Aşağıdaki mesajı imzalamak ister misiniz?",
          ta: "கீழே உள்ள செய்தியை உத்தியை செய்ய வேண்டுமா?",
          te: "క్రింది సందేశాన్ని సైన్ చేయాలా?",
          ko: "다음 메시지에 서명 하시겠습니까?",
          vi: "Bạn có muốn ký vào thông điệp sau?",
          pl: "Czy chcesz podpisać następującą wiadomość?",
          ro: "Doriți să semnați mesajul următor?",
          nl: "Wilt u het volgende bericht ondertekenen?",
          el: "Θέλετε να υπογράψετε το ακόλουθο μήνυμα;",
          th: "คุณต้องการลงลายมือชื่อในข้อความต่อไปหรือไม่?",
          cs: "Chcete podepsat následující zprávu?",
          hu: "Szeretné aláírni a következő üzenetet?",
          sv: "Vill du signera följande meddelande?",
          da: "Vil du underskrive følgende besked?",
        }, locale)}
      </div>
      <div className="h-2" />
      <div className="text-default-contrast">
        {Locale.get({
          en: "Some applications may ask you to sign a message to prove you own a specific address or to approve a specific action without doing a transaction.",
          zh: "一些应用程序可能会要求您签署一条消息，以证明您拥有特定地址或批准特定操作而无需进行交易。",
          hi: "कुछ एप्लिकेशन आपसे किसी विशेष पते के मालिक होने का सबूत देने या एक विशेष क्रिया को स्वीकृत करने के लिए एक संदेश पर हस्ताक्षर करने के लिए कह सकते हैं।",
          es: "Algunas aplicaciones pueden pedirte que firmes un mensaje para demostrar que eres el propietario de una dirección específica o para aprobar una acción específica sin realizar una transacción.",
          ar: "قد تطلب بعض التطبيقات منك توقيع رسالة لإثبات ملكك لعنوان معين أو للموافقة على إجراء معين دون إجراء معاملة.",
          fr: "Certaines applications peuvent vous demander de signer un message pour prouver que vous êtes le propriétaire d'une adresse spécifique ou pour approuver une action spécifique sans effectuer de transaction.",
          de: "Einige Anwendungen können Sie bitten, eine Nachricht zu signieren, um zu beweisen, dass Sie eine bestimmte Adresse besitzen oder eine bestimmte Aktion ohne Transaktion zu genehmigen.",
          ru: "Некоторые приложения могут попросить вас подписать сообщение, чтобы доказать, что вы владеете определенным адресом или одобрить определенное действие без выполнения транзакции.",
          pt: "Alguns aplicativos podem solicitar que você assine uma mensagem para provar que você é o proprietário de um endereço específico ou para aprovar uma ação específica sem fazer uma transação.",
          ja: "一部のアプリケーションは、トランザクションを行わずに特定のアクションを承認するために、特定のアドレスの所有権を証明するためにメッセージに署名するよう求める場合があります。",
          pa: "ਕੁਝ ਐਪਲੀਕੇਸ਼ਨ ਤੁਹਾਨੂੰ ਇੱਕ ਖਾਸ ਐਡਰੈੱਸ ਦਾ ਮਾਲਕ ਹੋਣ ਦਾ ਸਬੂਤ ਦੇਣ ਜਾਂ ਇੱਕ ਖਾਸ ਕਾਰਵਾਈ ਦੀ ਪ੍ਰਮਾਣਿਤੀ ਲਈ ਇੱਕ ਸੁਨੇਹਾ ਦੇ ਹਸਤਾਕ਷ਰ ਕਰਨ ਲਈ ਕਹ ਸਕਦੇ ਹਨ।",
          bn: "কিছু অ্যাপ্লিকেশন আপনাকে একটি বিশেষ ঠিকানার মালিকানা প্রমাণ করতে বা কোনও লেনদেন না করে একটি বিশেষ ক্রিয়া অনুমোদন করতে একটি বার্তা সাইন করার জন্য অনুরোধ করতে পারে।",
          id: "Beberapa aplikasi mungkin meminta Anda menandatangani pesan untuk membuktikan bahwa Anda memiliki alamat tertentu atau menyetujui tindakan tertentu tanpa melakukan transaksi.",
          ur: "کچھ ایپلیکیشن آپ سے کسی خاص پتے کے مالک ہونے کا ثبوت دینے یا کسی خاص عمل کو منظور کرنے کے لئے بغیر کسی ٹرانزیکشن کے ایک پیغام پر دستخط کرنے کے لئے کہ سکتی ہیں۔",
          ms: "Beberapa aplikasi mungkin meminta anda menandatangani mesej untuk membuktikan bahawa anda memiliki alamat tertentu atau meluluskan tindakan tertentu tanpa melakukan transaksi.",
          it: "Alcune applicazioni potrebbero chiederti di firmare un messaggio per dimostrare di essere il proprietario di un indirizzo specifico o per approvare un'azione specifica senza effettuare una transazione.",
          tr: "Bazı uygulamalar, belirli bir adresin sahibi olduğunuzu kanıtlamak veya bir işlem yapmadan belirli bir eylemi onaylamak için bir mesajı imzalamanızı isteyebilir.",
          ta: "சில பயன்பாடுகள் நீங்கள் குறிப்பிட்ட முகவரியை உங்களை உரிமையாளராக்க அல்லது ஒரு பரிவர்த்தனையை ஒரு பரிவர்த்தனையை செய்யாது ஒரு குறிப்பிட்ட செய்தியை உத்தியை செய்ய கேளும்.",
          te: "కొన్ని అనువర్తనాలు మీకు నిర్దిష్ట చిరునామాను నిర్వహించడానికి లేదా లేనిదానం చేయడానికి ఒక సందేశాన్ని సైన్ చేయడానికి మీరు అడిగిన ఉద్దేశం ఉంటుంది.",
          ko: "일부 응용 프로그램에서는 특정 주소의 소유권을 증명하거나 거래를 수행하지 않고 특정 작업을 승인하기 위해 메시지에 서명하도록 요청할 수 있습니다.",
          vi: "Một số ứng dụng có thể yêu cầu bạn ký vào một thông điệp để chứng minh bạn sở hữu một địa chỉ cụ thể hoặc phê duyệt một hành động cụ thể mà không cần thực hiện giao dịch.",
          pl: "Niektóre aplikacje mogą poprosić Cię o podpisanie wiadomości, aby udowodnić, że jesteś właścicielem określonego adresu lub zatwierdzić określoną akcję bez dokonywania transakcji.",
          ro: "Unele aplicații vă pot cere să semnați un mesaj pentru a dovedi că sunteți proprietarul unei anumite adrese sau pentru a aproba o acțiune specifică fără a face o tranzacție.",
          nl: "Sommige toepassingen kunnen u vragen een bericht te ondertekenen om te bewijzen dat u eigenaar bent van een specifiek adres of om een specifieke actie goed te keuren zonder een transactie uit te voeren.",
          el: "Κάποιες εφαρμογές μπορεί να σας ζητήσουν να υπογράψετε ένα μήνυμα για να αποδείξετε ότι είστε κάτοχος μιας συγκεκριμένης διεύθυνσης ή να εγκρίνετε μια συγκεκριμένη ενέργεια χωρίς να κάνετε μια συναλλαγή.",
          th: "แอปพลิเคชันบางแอปพลิเคชันอาจขอให้คุณเซ็นเอกสารเพื่อพิสูจน์ว่าคุณเป็นเจ้าของที่อยู่เฉพาะหรืออนุมัติการกระทำเฉพาะโดยไม่ต้องดำเนินการธุรกรรม",
          cs: "Některé aplikace vás mohou požádat, abyste podepsali zprávu, abyste prokázali, že vlastníte konkrétní adresu, nebo abyste schválili konkrétní akci bez provedení transakce.",
          hu: "Néhány alkalmazás kérheti, hogy írjon alá egy üzenetet annak bizonyítására, hogy Ön birtokol egy adott címet, vagy hogy jóváhagy egy adott műveletet anélkül, hogy tranzakciót hajtana végre.",
          sv: "Vissa applikationer kan be dig att signera ett meddelande för att bevisa att du äger en specifik adress eller för att godkänna en specifik åtgärd utan att göra en transaktion.",
          da: "Nogle applikationer kan bede dig om at underskrive en besked for at bevise, at du ejer en specifik adresse eller for at godkende en specifik handling uden at udføre en transaktion.",
        }, locale)}
      </div>
      <div className="h-4" />
      <div className="grow p-4 bg-default-contrast rounded-xl whitespace-pre-wrap break-words">
        {triedParsedData.mapSync(x => JSON.stringify(x, undefined, 2)).getOr("Could not decode message")}
      </div>
      <div className="h-4 grow" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableContrastButton
          onClick={rejectOrAlert.run}
          disabled={rejectOrAlert.loading}>
          <Outline.XMarkIcon className="size-5" />
          {Locale.get(Locale.Reject, locale)}
        </WideClickableContrastButton>
        <WideClickableOppositeButton
          onClick={approveOrAlert.run}
          disabled={approveOrAlert.loading}>
          <Outline.CheckIcon className="size-5" />
          {Locale.get(Locale.Approve, locale)}
        </WideClickableOppositeButton>
      </div>
    </PageBody>
  </UserPage>
}

export function WalletSelectPage() {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const hash = useHashSubpath(path)
  const create = useCoords(hash, "/create")

  const id = Option.wrap(path.url.searchParams.get("id")).getOrThrow()

  const wallets = useWallets()

  const [persistent, setPersistent] = useState(true)

  const onPersistentChange = useInputChange(e => {
    setPersistent(e.currentTarget.checked)
  }, [])

  const [selecteds, setSelecteds] = useState<Nullable<Wallet>[]>([])

  const onWalletClick = useCallback((wallet: Wallet) => {
    const clone = new Set(selecteds)

    if (clone.has(wallet))
      clone.delete(wallet)
    else
      clone.add(wallet)

    setSelecteds([...clone])
  }, [selecteds])

  const approveOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (selecteds.length === 0)
      throw new UIError(`No wallet selected`)

    await background.requestOrThrow({
      method: "brume_respond",
      params: [new RpcOk(id, [persistent, selecteds])]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path, selecteds, persistent])

  const rejectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await background.requestOrThrow({
      method: "brume_respond",
      params: [RpcErr.rewrap(id, new Err(new UserRejectedError()))]
    }).then(r => r.getOrThrow())

    location.replace(path.go("/done"))
  }), [background, id, path])

  const Header =
    <PageHeader title={Locale.get(Locale.ConnectionRequest, locale)}>
      <PaddedRoundedClickableNakedAnchor
        onKeyDown={create.onKeyDown}
        onClick={create.onClick}
        href={create.href}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedClickableNakedAnchor>
    </PageHeader>

  const Body =
    <PageBody>
      <SelectableWalletGrid
        wallets={wallets.data?.get()}
        ok={onWalletClick}
        selecteds={selecteds} />
      <div className="h-4" />
      <label className="po-2 flex items-center bg-default-contrast rounded-xl">
        <div className="flex-none">
          {Locale.get(Locale.ToStayConnected, locale)}
        </div>
        <div className="w-4 grow" />
        <input className="bg-transparent outline-none min-w-0 disabled:text-default-contrast"
          type="checkbox"
          checked={persistent}
          onChange={onPersistentChange} />
      </label>
      <div className="h-4" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableContrastButton
          onClick={rejectOrAlert.run}
          disabled={rejectOrAlert.loading}>
          <Outline.XMarkIcon className="size-5" />
          {Locale.get(Locale.Reject, locale)}
        </WideClickableContrastButton>
        <WideClickableOppositeButton
          onClick={approveOrAlert.run}
          disabled={approveOrAlert.loading}>
          <Outline.CheckIcon className="size-5" />
          {Locale.get(Locale.Approve, locale)}
        </WideClickableOppositeButton>
      </div>
    </PageBody>

  return <UserPage>
    <HashSubpathProvider>
      {hash.url.pathname === "/create" &&
        <Menu>
          <WalletCreatorMenu />
        </Menu>}
      {hash.url.pathname === "/create/standalone" &&
        <Dialog>
          <StandaloneWalletCreatorDialog />
        </Dialog>}
      {hash.url.pathname === "/create/readonly" &&
        <Dialog>
          <ReadonlyWalletCreatorDialog />
        </Dialog>}
    </HashSubpathProvider>
    {Header}
    {Body}
  </UserPage>
}

export function DonePage() {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()

  const requests = useAppRequests().current?.getOrNull()

  useEffect(() => {
    if (!requests?.length)
      return
    location.replace(path.go("/requests"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests])

  return <UserPage>
    <PageBody>
      <Dialog.Title>
        {Locale.get(Locale.Done, locale)}
      </Dialog.Title>
      <div className="h-2" />
      <div className="text-default-contrast">
        {Locale.get({
          en: "You can now close this window or continue to use it",
          zh: "您现在可以关闭此窗口或继续使用它",
          hi: "आप अब इस विंडो को बंद कर सकते हैं या इसका उपयोग जारी रख सकते हैं",
          es: "Ahora puedes cerrar esta ventana o seguir usándola",
          ar: "يمكنك الآن إغلاق هذه النافذة أو متابعة استخدامها",
          fr: "Vous pouvez maintenant fermer cette fenêtre ou continuer à l'utiliser",
          de: "Sie können jetzt dieses Fenster schließen oder weiterhin verwenden",
          ru: "Теперь вы можете закрыть это окно или продолжить его использование",
          pt: "Agora você pode fechar esta janela ou continuar a usá-la",
          ja: "このウィンドウを閉じるか、引き続き使用できます",
          pa: "ਤੁਸੀਂ ਹੁਣ ਇਸ ਝਲਕਾਂ ਨੂੰ ਬੰਦ ਕਰ ਸਕਦੇ ਹੋ ਜਾਂ ਇਸ ਦੀ ਵਰਤੋਂ ਜਾਰੀ ਰੱਖ ਸਕਦੇ ਹੋ",
          bn: "আপনি এখন এই উইন্ডোটি বন্ধ করতে পারেন অথবা এটি ব্যবহার করতে থাকতে পারেন",
          id: "Anda sekarang dapat menutup jendela ini atau melanjutkan penggunaannya",
          ur: "آپ اب اس ونڈو کو بند کر سکتے ہیں یا اس کا استعمال جاری رکھ سکتے ہیں",
          ms: "Anda kini boleh menutup tetingkap ini atau meneruskan penggunaannya",
          it: "Ora puoi chiudere questa finestra o continuare a usarla",
          tr: "Bu pencereyi şimdi kapatabilir veya kullanmaya devam edebilirsiniz",
          ta: "இந்த சாளரத்தை மூட அல்லது அதைப் பயன்படுத்த முடியும்",
          te: "ఈ విండోను మూసివేయడం లేదా కొనసాగి ఉపయోగించవచ్చు",
          ko: "이 창을 닫거나 계속 사용할 수 있습니다",
          vi: "Bạn có thể đóng cửa sổ này hoặc tiếp tục sử dụng",
          pl: "Możesz teraz zamknąć to okno lub kontynuować jego używanie",
          ro: "Acum puteți închide această fereastră sau să continuați să o utilizați",
          nl: "U kunt dit venster nu sluiten of blijven gebruiken",
          el: "Μπορείτε τώρα να κλείσετε αυτό το παράθυρο ή να συνεχίσετε να το χρησιμοποιείτε",
          th: "คุณสามารถปิดหน้าต่างนี้หรือดำเนินการต่อได้",
          cs: "Nyní můžete toto okno zavřít nebo pokračovat v jeho používání",
          hu: "Most becsukhatja ezt az ablakot vagy folytathatja annak használatát",
          sv: "Du kan nu stänga detta fönster eller fortsätta att använda det",
          da: "Du kan nu lukke dette vindue eller fortsætte med at bruge det",
        }, locale)}
      </div>
      <div className="h-4" />
      <div className="grow flex flex-col items-center justify-center">
        <ClickableOppositeAnchor
          href="#/home">
          <Outline.HomeIcon className="size-5" />
          {Locale.get(Locale.Home, locale)}
        </ClickableOppositeAnchor>
      </div>
    </PageBody>
  </UserPage>
}