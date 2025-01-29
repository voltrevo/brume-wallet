import { OkProps } from "@/libs/react/props/promise";
import { Dialog } from "@/libs/ui/dialog";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";

export type WalletNonceDialogState = {
  readonly chain?: string
}

export function WalletNonceDialog(props: OkProps<void>) {
  const lang = useLocaleContext().getOrThrow()

  return <>
    <Dialog.Title>
      Select nonce
    </Dialog.Title>
    <div className="h-4" />
    <div className="text-lg font-medium">
      Pending transactions
    </div>
    <div className="grow flex flex-col items-center justify-center">
      {Locale.get(Locale.ComingSoon, lang)}...
    </div>
  </>
}