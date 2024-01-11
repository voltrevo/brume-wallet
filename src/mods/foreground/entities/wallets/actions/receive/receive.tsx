/* eslint-disable @next/next/no-img-element */
import { useCopy } from "@/libs/copy/copy";
import { Button } from "@/libs/ui/button";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Address } from "@hazae41/cubane";
import { Result } from "@hazae41/result";
import createQR from "@paulmillr/qr";
import { useCallback, useMemo } from "react";
import { useWalletDataContext } from "../../context";

export function WalletDataReceiveScreen(props: {}) {
  const close = useCloseContext().unwrap()
  const wallet = useWalletDataContext().unwrap()

  const address = useMemo(() => {
    return Address.from(wallet.address)!
  }, [wallet.address])

  const url = useMemo(() => {
    const bytes = createQR(address, "gif", { ecc: "medium", scale: 10 })
    const blob = new Blob([bytes], { type: "image/gif" })

    return URL.createObjectURL(blob)
  }, [address])

  const onCopyClick = useCopy(address)

  const onShareClick = useCallback(async () => {
    await Result.runAndWrap(async () => {
      await navigator.share({ text: address })
    }).then(r => r.ignore())
  }, [address])

  return <>
    <Dialog.Title close={close}>
      Receive
    </Dialog.Title>
    <div className="grow flex flex-col items-center justify-center">
      <div className="text-xl font-medium">
        {wallet.name}
      </div>
      <button className="text-contrast text-center cursor-pointer"
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
      <button className={`${Button.Base.className} ${Button.Contrast.className} bg-high-contrast po-md`}
        onClick={onShareClick}>
        Share
      </button>}
  </>
}