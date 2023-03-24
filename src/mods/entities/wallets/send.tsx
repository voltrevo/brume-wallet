import { Hex } from "@/libs/hex/hex";
import { Outline } from "@/libs/icons/icons";
import { Dialog } from "@/libs/modals/dialog";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/async";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { Rpc } from "@/libs/rpc";
import { Types } from "@/libs/types/types";
import { ContainedButton } from "@/mods/components/button";
import { useSessions } from "@/mods/tor/sessions/context";
import { getAddress, parseUnits, Wallet } from "ethers";
import { useMemo, useState } from "react";
import { useBalance, useGasPrice, useNonce, WalletDataProps } from "./data";

export function SendDialog(props: WalletDataProps & CloseProps) {
  const { wallet, close } = props

  const sessions = useSessions()

  const balance = useBalance(wallet.address, sessions)
  const nonce = useNonce(wallet.address, sessions)
  const gasPrice = useGasPrice(sessions)

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
    if (!sessions) return
    if (!wallet) return

    if (!Types.isBigInt(nonce.data)) return
    if (!Types.isBigInt(gasPrice.data)) return

    const session = await sessions.cryptoRandom()

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
  }, [sessions, wallet.address, nonce.data, gasPrice.data, recipientInput, valueInput], console.error)

  const TxHashDisplay =
    <div className="text-break">
      <div className="text-colored">
        Transaction hash:
      </div>
      <span className="text-contrast text-sm">
        {txHash}
      </span>
      <ExternalDivisionLink className="flex items-center gap-2 text-colored cursor-pointer hover:underline w-[150px]"
        href={`https://goerli.etherscan.io/tx/${txHash}`} target="no">
        <span className="text-sm">See on etherscan</span>
        <Outline.ArrowTopRightOnSquareIcon className="icon-xs" />
      </ExternalDivisionLink>
    </div>

  const disabled = useMemo(() => {
    if (!recipientInput)
      return true
    if (!valueInput)
      return true
    return false
  }, [recipientInput, valueInput])

  const SendButton =
    <ContainedButton className="w-full"
      disabled={disabled}
      icon={Outline.PaperAirplaneIcon}
      onClick={trySend.run}>
      {trySend.loading
        ? "Loading..."
        : "Send"}
    </ContainedButton>

  return <Dialog close={close}>
    <div className="text-xl font-medium">
      Send
    </div>
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