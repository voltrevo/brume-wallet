/* eslint-disable @next/next/no-img-element */
import { Events } from "@/libs/react/events";
import { Dialog, useDialogContext } from "@/libs/ui/dialog/dialog";
import { Address } from "@hazae41/cubane";
import createQR from "@paulmillr/qr";
import { useMemo } from "react";
import { useWalletDataContext } from "../../context";

export function WalletDataReceiveDialog(props: {}) {
  const { close } = useDialogContext().unwrap()
  const wallet = useWalletDataContext().unwrap()

  const address = useMemo(() => {
    return Address.from(wallet.address)!
  }, [wallet.address])

  const url = useMemo(() => {
    const bytes = createQR(address, "gif", { ecc: "medium", scale: 10 })
    const blob = new Blob([bytes], { type: "image/gif" })

    return URL.createObjectURL(blob)
  }, [address])

  return <>
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
      spellCheck={false}
      onPaste={Events.noop}
      onCut={Events.Clipboard.reset}
      onKeyDown={Events.Keyboard.noop}
      onClick={Events.Mouse.select}>
      {address}
    </div>
  </>
}