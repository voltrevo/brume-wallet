import { Radix } from "@/libs/hex/hex";
import { Outline } from "@/libs/icons/icons";
import { Dialog, DialogTitle } from "@/libs/modals/dialog";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { TitleProps } from "@/libs/react/props/title";
import { Rpc } from "@/libs/rpc";
import { Types } from "@/libs/types/types";
import { GradientButton } from "@/mods/components/buttons/button";
import { SessionProps } from "@/mods/tor/sessions/props";
import { Wallet, getAddress, parseUnits } from "ethers";
import { useMemo, useState } from "react";
import { WalletDataProps, useBalance, useGasPrice, useNonce } from "./data";

export function SendDialog(props: TitleProps & CloseProps & WalletDataProps & SessionProps) {
  const { title, wallet, session, close } = props

  const balance = useBalance(wallet.address, session)
  const nonce = useNonce(wallet.address, session)
  const gasPrice = useGasPrice(session)

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
    if (!Types.isBigInt(nonce.data))
      return
    if (!Types.isBigInt(gasPrice.data))
      return

    const ethers = new Wallet(wallet.privateKey)

    const gasReq = session.client.request({
      method: "eth_estimateGas",
      params: [{
        chainId: Radix.toHex(session.chain.id),
        from: wallet.address,
        to: getAddress(recipientInput),
        value: Radix.toHex(parseUnits(valueInput, 18)),
        nonce: Radix.toHex(nonce.data),
        gasPrice: Radix.toHex(gasPrice.data)
      }, "latest"]
    })

    const gasRes = await Rpc.fetchWithSocket<string>(gasReq, session.socket)

    if (gasRes.isErr())
      return setError(gasRes.inner)

    const txReq = session.client.request({
      method: "eth_sendRawTransaction",
      params: [await ethers.signTransaction({
        chainId: session.chain.id,
        from: wallet.address,
        to: getAddress(recipientInput),
        value: parseUnits(valueInput, 18),
        nonce: Number(nonce.data),
        gasPrice: gasPrice.data,
        gasLimit: gasRes.inner
      })]
    })

    const body = JSON.stringify({ method: "eth_sendRawTransaction", tor: true })
    session.circuit.fetch("http://proxy.brume.money", { method: "POST", body })

    const txRes = await Rpc.fetchWithSocket<string>(txReq, session.socket)

    if (txRes.isErr())
      return setError(txRes.inner)

    setTxHash(txRes.inner)
    setError(undefined)

    balance.refetch()
    nonce.refetch()
  }, [session, wallet.address, nonce.data, gasPrice.data, recipientInput, valueInput])

  const TxHashDisplay = <>
    <div className="">
      Transaction hash
    </div>
    <div className="text-contrast truncate">
      {txHash}
    </div>
    <div className="h-2" />
    <ExternalDivisionLink className="w-full"
      href={`https://etherscan.io/tx/${txHash}`}
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