import { OkProps } from "@/libs/react/props/promise";
import { Dialog } from "@/libs/ui/dialog/dialog";

export type WalletNonceDialogState = {
  readonly chain?: string
}

export function WalletNonceDialog(props: OkProps<void>) {
  return <>
    <Dialog.Title>
      Select nonce
    </Dialog.Title>
    <div className="h-4" />
    <div className="text-lg font-medium">
      Pending transactions
    </div>
    <div className="grow flex flex-col items-center justify-center">
      Coming soon...
    </div>
  </>
}