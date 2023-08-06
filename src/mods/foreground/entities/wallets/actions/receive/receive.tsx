/* eslint-disable @next/next/no-img-element */
import { Events } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { Dialog } from "@/libs/ui/dialog/dialog";
import createQR from "@paulmillr/qr";
import { useMemo } from "react";
import { useWalletData } from "../../context";

export function WalletDataReceiveDialog(props: CloseProps) {
  const { close } = props
  const wallet = useWalletData()

  const url = useMemo(() => {
    const bytes = createQR(wallet.address, "gif", { ecc: "medium", scale: 10 })
    const blob = new Blob([bytes], { type: "image/gif" })

    return URL.createObjectURL(blob)
  }, [wallet])

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      Receive
    </Dialog.Title>
    <div className="m-auto max-w-xs">
      <img className=""
        alt="QR code"
        src={url} />
    </div>
    <div className="text-center cursor-pointer break-all outline-none"
      contentEditable
      suppressContentEditableWarning
      onPaste={Events.noop}
      onCut={Events.Clipboard.reset}
      onKeyDown={Events.Keyboard.noop}
      onClick={Events.Mouse.select}>
      {wallet.address}
    </div>
  </Dialog>
}