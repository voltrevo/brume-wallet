import { Hex } from "@/libs/hex/hex";
import { Outline } from "@/libs/icons/icons";
import { Dialog, DialogTitle } from "@/libs/modals/dialog";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { Rpc } from "@/libs/rpc";
import { Types } from "@/libs/types/types";
import { GradientButton } from "@/mods/components/buttons/button";
import { ButtonChip } from "@/mods/components/buttons/chips";
import { SessionProps } from "@/mods/tor/sessions/props";
import { Wallet, getAddress, parseUnits } from "ethers";
import { useMemo, useState } from "react";
import { WalletDataProps, useBalance, useGasPrice, useNonce } from "./data";

export function SendDialog(props: WalletDataProps & CloseProps & SessionProps) {
  const { wallet, session, close } = props

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
      Value
    </div>
    <div className="h-2" />
    <input className="p-xmd w-full rounded-xl outline-none bg-transparent border border-contrast focus:border-opposite"
      value={valueInput}
      placeholder="1.0"
      onChange={onValueInputChange} />
  </>

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
        chainId: Hex.from(5),
        from: wallet.address,
        to: getAddress(recipientInput),
        value: Hex.from(parseUnits(valueInput, 18)),
        nonce: Hex.from(nonce.data),
        gasPrice: Hex.from(gasPrice.data)
      }, "latest"]
    })

    const gasRes = await Rpc.fetchWithSocket<string>(gasReq, session.socket)

    if (gasRes.error) throw gasRes.error

    const txReq = session.client.request({
      method: "eth_sendRawTransaction",
      params: [await ethers.signTransaction({
        chainId: 5,
        from: wallet.address,
        to: getAddress(recipientInput),
        value: parseUnits(valueInput, 18),
        nonce: Number(nonce.data),
        gasPrice: gasPrice.data,
        gasLimit: gasRes.result
      })]
    })

    const body = JSON.stringify({ method: "eth_sendRawTransaction", tor: true })
    session.circuit.fetch("http://proxy.brume.money", { method: "POST", body })

    const txRes = await Rpc.fetchWithSocket<string>(txReq, session.socket)

    if (txRes.error !== undefined) throw txRes.error

    setTxHash(txRes.result)

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
    <div className="flex">
      <ExternalDivisionLink
        href={`https://goerli.etherscan.io/tx/${txHash}`}
        target="_blank" rel="noreferrer">
        <ButtonChip icon={Outline.ArrowTopRightOnSquareIcon}>
          Etherscan
        </ButtonChip>
      </ExternalDivisionLink>
    </div>
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
      Send
    </DialogTitle>
    <div className="h-2" />
    {RecipientInput}
    <div className="h-2" />
    {ValueInput}
    <div className="h-2" />
    {txHash && <>
      {TxHashDisplay}
      <div className="h-2" />
    </>}
    <div className="h-2" />
    {SendButton}
  </Dialog>
}