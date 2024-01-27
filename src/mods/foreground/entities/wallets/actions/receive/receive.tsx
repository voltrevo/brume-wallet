/* eslint-disable @next/next/no-img-element */
import { useCopy } from "@/libs/copy/copy";
import { Outline } from "@/libs/icons/icons";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Address } from "@hazae41/cubane";
import { Result } from "@hazae41/result";
import createQR from "@paulmillr/qr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWalletDataContext } from "../../context";
import { WideShrinkableOppositeButton } from "../send";

export function WalletDataReceiveScreen(props: {}) {
  const wallet = useWalletDataContext().unwrap()

  const address = useMemo(() => {
    return Address.from(wallet.address)!
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
    await Result.runAndWrap(async () => {
      await navigator.share({ text: address })
    }).then(r => r.ignore())
  }, [address])

  return <>
    <Dialog.Title>
      Receive
    </Dialog.Title>
    <div className="h-4" />
    <div className="grow flex flex-col items-center justify-center">
      <div className="text-2xl font-medium">
        {wallet.name}
      </div>
      <button className="text-contrast text-center outline-none"
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
      <div className="text-contrast text-center max-w-xs">
        {`This is an Ethereum address, only send Ethereum-compatible stuff to this address`}
      </div>
    </div>
    {typeof navigator.share === "function" &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableOppositeButton
          onClick={onShareClick}>
          <Outline.ShareIcon className="size-5" />
          Share
        </WideShrinkableOppositeButton>
      </div>}
  </>
}