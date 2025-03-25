/* eslint-disable @next/next/no-img-element */
import { Errors } from "@/libs/errors"
import { Outline } from "@/libs/icons"
import { isSafariExtension } from "@/libs/platform/platform"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { PaddedRoundedClickableNakedButton } from "@/libs/ui/button"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { useLocaleContext } from "@/mods/foreground/global/mods/locale"
import { Locale } from "@/mods/foreground/locale"
import { UserGuardBody } from "@/mods/foreground/user/mods/guard"
import { useUserStorageContext } from "@/mods/foreground/user/mods/storage"
import { usePathContext } from "@hazae41/chemin"
import { useCallback } from "react"
import { FgWallet, useTrashedWallets } from "../../data"
import { ClickableWalletGrid } from "../page"

export function TrashedWalletsPage() {
  const locale = useLocaleContext().getOrThrow()
  const storage = useUserStorageContext().getOrThrow()

  const walletsQuery = useTrashedWallets()
  const maybeWallets = walletsQuery.current?.getOrNull()

  const trashAllOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!isSafariExtension() && confirm("Are you sure you want to delete all wallets in the trash?") === false)
      return

    for (const wallet of maybeWallets ?? [])
      await FgWallet.schema(wallet.uuid, storage)?.deleteOrThrow()

    return
  }), [maybeWallets, storage])

  return <UserPage>
    <PageHeader title={Locale.get(Locale.Trash, locale)}>
      <PaddedRoundedClickableNakedButton
        disabled={trashAllOrAlert.loading}
        onClick={trashAllOrAlert.run}>
        <Outline.TrashIcon className="size-5" />
      </PaddedRoundedClickableNakedButton>
    </PageHeader>
    <div className="po-2 flex items-center">
      <div className="text-default-contrast">
        {Locale.get({
          en: `Wallets in the trash are automatically deleted after 30 days.`,
          zh: `回收站中的钱包将在 30 天后自动删除。`,
          hi: `कूड़े में रखे गए वॉलेट 30 दिनों के बाद स्वचालित रूप से हटा दिए जाते हैं।`,
          es: `Las billeteras en la papelera se eliminan automáticamente después de 30 días.`,
          ar: `يتم حذف المحافظ في سلة المهملات تلقائيًا بعد 30 يومًا.`,
          fr: `Les portefeuilles dans la corbeille sont automatiquement supprimés après 30 jours.`,
          de: `Wallets im Papierkorb werden nach 30 Tagen automatisch gelöscht.`,
          ru: `Кошельки в корзине удаляются автоматически через 30 дней.`,
          pt: `As carteiras na lixeira são excluídas automaticamente após 30 dias.`,
          ja: `ゴミ箱のウォレットは30日後に自動的に削除されます。`,
          pa: `ਰੱਦੀ ਵਿੱਚ ਰੱਖੇ ਗਏ ਵਾਲੇ 30 ਦਿਨਾਂ ਬਾਅਦ ਆਪਣੇ ਆਪ ਹਟਾ ਦਿੱਤੇ ਜਾਂਦੇ ਹਨ।`,
          bn: `ট্র্যাশে রাখা ওয়ালেটগুলি 30 দিন পর স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়।`,
          id: `Dompet di tempat sampah akan dihapus secara otomatis setelah 30 hari.`,
          ur: `ردی میں رکھے گئے والٹس 30 دنوں کے بعد خود بخود حذف ہو جاتے ہیں۔`,
          ms: `Dompet dalam tong sampah akan dipadamkan secara automatik selepas 30 hari.`,
          it: `I portafogli nel cestino vengono eliminati automaticamente dopo 30 giorni.`,
          tr: `Çöp kutusundaki cüzdanlar 30 gün sonra otomatik olarak silinir.`,
          ta: `குப்பையில் உள்ள வாலட்கள் 30 நாட்களுக்கு பின் தானாக நீக்கப்படும்.`,
          te: `ట్రాష్‌లో ఉన్న వాలెట్‌లు 30 రోజుల తరువాత స్వయంచాలకంగా తొలగిపోతాయి.`,
          ko: `휴지통에 있는 지갑은 30 일 후 자동으로 삭제됩니다.`,
          vi: `Ví trong thùng rác sẽ tự động xóa sau 30 ngày.`,
          pl: `Portfele w koszu są automatycznie usuwane po 30 dniach.`,
          ro: `Portofelele din coșul de gunoi sunt șterse automat după 30 de zile.`,
          nl: `Wallets in de prullenbak worden automatisch verwijderd na 30 dagen.`,
          el: `Τα πορτοφόλια στον κάδο απορριμμάτων διαγράφονται αυτόματα μετά από 30 ημέρες.`,
          th: `กระเป๋าเงินในถังขยะจะถูกลบโดยอัตโนมัติหลังจาก 30 วัน`,
          cs: `Peněženky v koši jsou po 30 dnech automaticky smazány.`,
          hu: `A pénztárcák a szemétkosárban 30 nap után automatikusan törlődnek.`,
          sv: `Plånböcker i papperskorgen raderas automatiskt efter 30 dagar.`,
          da: `Wallets i papirkurven slettes automatisk efter 30 dage.`,
        }, locale)}
      </div>
    </div>
    <UserGuardBody>
      <TrashedWalletsBody />
    </UserGuardBody>
  </UserPage>
}

export function TrashedWalletsBody() {
  const path = usePathContext().getOrThrow()

  const walletsQuery = useTrashedWallets()
  const maybeWallets = walletsQuery.current?.getOrNull()

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(path.go(`/wallet/${wallet.uuid}`))
  }, [path])

  return <PageBody>
    <ClickableWalletGrid
      disableNew
      ok={onWalletClick}
      wallets={maybeWallets} />
  </PageBody>
}