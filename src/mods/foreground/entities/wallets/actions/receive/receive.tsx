/* eslint-disable @next/next/no-img-element */
import { useCopy } from "@/libs/copy/copy";
import { Outline } from "@/libs/icons/icons";
import { WideClickableOppositeButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { Address } from "@hazae41/cubane";
import { Result } from "@hazae41/result";
import createQR from "@paulmillr/qr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWalletDataContext } from "../../context";

export function WalletDataReceiveScreen(props: {}) {
  const wallet = useWalletDataContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()

  const address = useMemo(() => {
    return Address.fromOrThrow(wallet.address)
  }, [wallet.address])

  const [url, setUrl] = useState<string>()

  useEffect(() => {
    const bytes = createQR(address, "gif", { ecc: "medium", scale: 10 })
    const blob = new Blob([bytes], { type: "image/gif" })
    const url = URL.createObjectURL(blob)

    setUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [address])

  const onCopyClick = useCopy(address)

  const onShareClick = useCallback(async () => {
    await Result.runAndWrap(() => navigator.share({ text: address }))
  }, [address])

  return <>
    <Dialog.Title>
      {Locale.get(Locale.Receive, locale)}
    </Dialog.Title>
    <div className="h-4" />
    <div className="grow flex flex-col items-center justify-center h-[600px]">
      <div className="text-2xl font-medium">
        {wallet.name}
      </div>
      <button className="text-default-contrast text-center outline-none"
        onClick={onCopyClick.run}>
        {onCopyClick.current
          ? "Copied"
          : Address.format(address)}
      </button>
      <div className="h-4" />
      <div className="bg-white rounded-xl p-1">
        <img className=""
          alt="QR code"
          src={url} />
      </div>
      <div className="h-4" />
      <div className="text-default-contrast text-center max-w-xs">
        {Locale.get({
          en: `This is an Ethereum address, only send Ethereum-compatible stuff to this address`,
          zh: `这是一个以太坊地址，只能发送兼容以太坊的东西到这个地址`,
          hi: `यह एक ईथेरियम पता है, केवल इस पते पर ईथेरियम संगत चीजें भेजें`,
          es: `Esta es una dirección de Ethereum, solo envíe cosas compatibles con Ethereum a esta dirección`,
          ar: `هذا عنوان Ethereum ، أرسل فقط الأشياء المتوافقة مع Ethereum إلى هذا العنوان`,
          fr: `Ceci est une adresse Ethereum, envoyez uniquement des choses compatibles avec Ethereum à cette adresse`,
          de: `Dies ist eine Ethereum-Adresse, senden Sie nur Ethereum-kompatible Dinge an diese Adresse`,
          ru: `Это адрес Ethereum, отправляйте на этот адрес только совместимые с Ethereum вещи`,
          pt: `Este é um endereço Ethereum, envie apenas coisas compatíveis com Ethereum para este endereço`,
          ja: `これはEthereumアドレスです、このアドレスにはEthereum互換のもののみを送信してください`,
          pa: `ਇਹ ਇੱਕ ਇਥੇਰੀਅਮ ਪਤਾ ਹੈ, ਇਸ ਪਤੇ 'ਤੇ ਸਿਰਫ ਇਥੇਰੀਅਮ ਸੰਗਤ ਚੀਜ਼ਾਂ ਭੇਜੋ`,
          bn: `এটা একটি ইথেরিয়াম ঠিকানা, এই ঠিকানাতে কেবল ইথেরিয়াম-সাথী জিনিস পাঠান`,
          id: `Ini adalah alamat Ethereum, kirim hanya sesuatu yang kompatibel dengan Ethereum ke alamat ini`,
          ur: `یہ ایک ایتھیریم پتہ ہے, اس پتہ پر صرف ایتھیریم سازگار چیزیں بھیجیں`,
          ms: `Ini adalah alamat Ethereum, hanya hantar sesuatu yang serasi dengan Ethereum ke alamat ini`,
          it: `Questo è un indirizzo Ethereum, invia solo cose compatibili con Ethereum a questo indirizzo`,
          tr: `Bu bir Ethereum adresidir, bu adrese yalnızca Ethereum uyumlu şeyler gönderin`,
          ta: `இது ஒரு எதெரியம் முகவரி, இந்த முகவரிக்கு எதெரியம் பொருள்களை மட்டும் அனுப்பவும்`,
          te: `ఇది ఒక ఎథరియమ్ చిరునామా, ఈ చిరునామకు మాత్రమే ఎథరియమ్ అనుకూలంగా ఉన్న వస్తువులను పంపండి`,
          ko: `이것은 이더리움 주소입니다. 이 주소로는 이더리움 호환 항목만 보낼 수 있습니다`,
          vi: `Đây là một địa chỉ Ethereum, chỉ gửi các thứ tương thích với Ethereum đến địa chỉ này`,
          pl: `To jest adres Ethereum, wyślij na ten adres tylko rzeczy zgodne z Ethereum`,
          ro: `Aceasta este o adresă Ethereum, trimiteți doar lucruri compatibile cu Ethereum la această adresă`,
          nl: `Dit is een Ethereum-adres, stuur alleen Ethereum-compatibele dingen naar dit adres`,
          el: `Αυτή είναι μια διεύθυνση Ethereum, στείλτε μόνο πράγματα συμβατά με το Ethereum σε αυτήν τη διεύθυνση`,
          th: `นี่คือที่อยู่ Ethereum, ส่งสิ่งที่เข้ากันกับ Ethereum เท่านั้นไปยังที่อยู่นี้`,
          cs: `Toto je adresa Ethereum, na tuto adresu posílejte pouze věci kompatibilní s Ethereum`,
          hu: `Ez egy Ethereum cím, csak Ethereum-kompatibilis dolgokat küldjön erre a címre`,
          sv: `Detta är en Ethereum-adress, skicka bara Ethereum-kompatibla saker till denna adress`,
          da: `Dette er en Ethereum-adresse, send kun Ethereum-kompatible ting til denne adresse`,
        }, locale)}
      </div>
    </div>
    <div className="h-4 grow" />
    {typeof navigator.share === "function" &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableOppositeButton
          onClick={onShareClick}>
          <Outline.ShareIcon className="size-5" />
          {Locale.get(Locale.Share, locale)}
        </WideClickableOppositeButton>
      </div>}
  </>
}