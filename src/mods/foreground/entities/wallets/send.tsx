import { Outline } from "@/libs/icons/icons";
import { Dialog, DialogTitle } from "@/libs/modals/dialog";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { TitleProps } from "@/libs/react/props/title";
import { Types } from "@/libs/types/types";
import { GradientButton } from "@/mods/foreground/components/buttons/button";
import { Err, Ok, Result } from "@hazae41/result";
import { useMemo, useState } from "react";
import { EthereumHandleProps, WalletDataProps, useBalance, useGasPrice, useNonce } from "./data";

export function SendDialog(props: TitleProps & CloseProps & WalletDataProps & EthereumHandleProps) {
  const { title, wallet, handle, close } = props

  const balance = useBalance(wallet.address, handle)
  const nonce = useNonce(wallet.address, handle)
  const gasPrice = useGasPrice(handle)

  const [recipientInput = "", setRecipientInput] = useState<string>()

  const onRecipientInputChange = useInputChange(e => {
    setRecipientInput(e.currentTarget.value)
  }, [])

  const RecipientInput = <>
    <div className="">
      Recipient
    </div>
    <div className="h-2" />
    <input className="p-xmd w-full rounded-xl outline-none bg-transparent border border-contrast focus:border-opposite"
      value={recipientInput}
      placeholder="0x..."
      onChange={onRecipientInputChange} />
  </>

  const [valueInput = "", setValueInput] = useState<string>()

  const onValueInputChange = useInputChange(e => {
    const value = e.currentTarget.value
      .replaceAll(/[^\d.,]/g, "")
      .replaceAll(",", ".")
    setValueInput(value)
  }, [])

  const ValueInput = <>
    <div className="">
      Value (ETH)
    </div>
    <div className="h-2" />
    <input className="p-xmd w-full rounded-xl outline-none bg-transparent border border-contrast focus:border-opposite"
      value={valueInput}
      placeholder="1.0"
      onChange={onValueInputChange} />
  </>

  const [error, setError] = useState<Error>()
  const [txHash, setTxHash] = useState<string>()

  const trySend = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!Types.isBigInt(nonce.data))
        return new Err(new Error(`Invalid nonce`))
      if (!Types.isBigInt(gasPrice.data))
        return new Err(new Error(`Invalid gas price`))

      // const ethers = new Wallet(wallet.privateKey)
      // const socket = await session.socket.tryGet(0).then(r => r.throw(t))

      // const gasRes = await session.client.tryFetchWithSocket<string>(socket, {
      //   method: "eth_estimateGas",
      //   params: [{
      //     chainId: Radix.toHex(session.chain.id),
      //     from: wallet.address,
      //     to: getAddress(recipientInput),
      //     value: Radix.toHex(parseUnits(valueInput, 18)),
      //     nonce: Radix.toHex(nonce.data),
      //     gasPrice: Radix.toHex(gasPrice.data)
      //   }, "latest"]
      // }, AbortSignals.timeout(5_000)).then(r => r.throw(t).throw(t))

      // const txRes = await session.client.tryFetchWithSocket<string>(socket, {
      //   method: "eth_sendRawTransaction",
      //   params: [await ethers.signTransaction({
      //     chainId: session.chain.id,
      //     from: wallet.address,
      //     to: getAddress(recipientInput),
      //     value: parseUnits(valueInput, 18),
      //     nonce: Number(nonce.data),
      //     gasPrice: gasPrice.data,
      //     gasLimit: gasRes
      //   })]
      // }, AbortSignals.timeout(5_000)).then(r => r.throw(t).throw(t))

      // const body = JSON.stringify({ method: "eth_sendRawTransaction", tor: true })

      // session.circuit
      //   .tryFetch("http://proxy.brume.money", { method: "POST", body })
      //   .then(r => r.inspectErrSync(console.debug).ignore())

      // setTxHash(txRes)
      // setError(undefined)

      // balance.refetch()
      // nonce.refetch()

      return Ok.void()
    }).then(r => r.inspectErrSync(setError).ignore())
  }, [handle, wallet.address, nonce.data, gasPrice.data, recipientInput, valueInput])

  const TxHashDisplay = <>
    <div className="">
      Transaction hash
    </div>
    <div className="text-contrast truncate">
      {txHash}
    </div>
    <div className="h-2" />
    <ExternalDivisionLink className="w-full"
      href={`${handle.chain.etherscan}/tx/${txHash}`}
      target="_blank" rel="noreferrer">
      <GradientButton className="w-full"
        colorIndex={wallet.color}
        icon={Outline.ArrowTopRightOnSquareIcon}>
        Etherscan
      </GradientButton>
    </ExternalDivisionLink>
  </>

  const disabled = useMemo(() => {
    if (!Types.isBigInt(nonce.data))
      return true
    if (!Types.isBigInt(gasPrice.data))
      return true
    if (!recipientInput)
      return true
    if (!valueInput)
      return true
    return false
  }, [nonce.data, gasPrice.data, recipientInput, valueInput])

  const SendButton =
    <GradientButton className="w-full"
      colorIndex={wallet.color}
      disabled={trySend.loading || disabled}
      icon={Outline.PaperAirplaneIcon}
      onClick={trySend.run}>
      {trySend.loading
        ? "Loading..."
        : "Send"}
    </GradientButton>

  return <Dialog close={close}>
    <DialogTitle close={close}>
      Send {title}
    </DialogTitle>
    <div className="h-2" />
    {RecipientInput}
    <div className="h-2" />
    {ValueInput}
    <div className="h-4" />
    {error && <>
      <div className="text-red-500">
        {error.message}
      </div>
      <div className="h-2" />
    </>}
    {txHash ? <>
      {TxHashDisplay}
    </> : <>
      {SendButton}
    </>}
  </Dialog>
}