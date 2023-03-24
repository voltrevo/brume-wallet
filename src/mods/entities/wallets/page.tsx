/* eslint-disable @next/next/no-img-element */
import { BigInts } from "@/libs/bigints/bigints";
import { useCopy } from "@/libs/copy/copy";
import { Hex } from "@/libs/hex/hex";
import { Outline } from "@/libs/icons/icons";
import { HoverPopper } from "@/libs/modals/popper";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/async";
import { useInputChange } from "@/libs/react/events";
import { useElement } from "@/libs/react/handles/element";
import { Rpc } from "@/libs/rpc";
import { Types } from "@/libs/types/types";
import { ContainedButton } from "@/mods/components/button";
import { useSessions } from "@/mods/tor/sessions/context";
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { getAddress, parseUnits, Wallet } from "ethers";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { WalletAvatar } from "./avatar";
import { useBalance, useGasPrice, useNonce, useWallet } from "./data";

export function WalletPage(props: { address: string }) {
  const { address } = props

  const router = useRouter()
  const sessions = useSessions()

  const wallet = useWallet(address)
  const balance = useBalance(address, sessions)
  const nonce = useNonce(address, sessions)
  const gasPrice = useGasPrice(sessions)

  const [recipientInput = "", setRecipientInput] = useState<string>()

  const onRecipientInputChange = useInputChange(e => {
    setRecipientInput(e.currentTarget.value)
  }, [])

  const [valueInput = "", setValueInput] = useState<string>()

  const onValueInputChange = useInputChange(e => {
    const value = e.currentTarget.value
      .replaceAll(/[^\d.,]/g, "")
      .replaceAll(",", ".")
    setValueInput(value)
  }, [])

  const [txHash, setTxHash] = useState<string>()

  const trySend = useAsyncUniqueCallback(async () => {
    if (!sessions) return
    if (!wallet.data) return

    if (!Types.isBigInt(nonce.data)) return
    if (!Types.isBigInt(gasPrice.data)) return

    const session = await sessions.cryptoRandom()

    const ethers = new Wallet(wallet.data.privateKey)

    const gasReq = session.client.request({
      method: "eth_estimateGas",
      params: [{
        chainId: Hex.from(5),
        from: address,
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
        from: address,
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
  }, [sessions, address, nonce.data, gasPrice.data, recipientInput, valueInput], console.error)

  const fbalance = (() => {
    if (balance.error !== undefined)
      return "Error"
    if (balance.data === undefined)
      return "..."
    return BigInts.float(balance.data, 18)
  })()

  const copyPopper = useElement()
  const copyRunner = useCopy(address)

  const WalletInfo =
    <div className="p-xmd flex flex-col items-center">
      <WalletAvatar
        size={5}
        textSize={3}
        address={address} />
      <div className="h-2" />
      <div className="text-xl font-medium max-w-[200px] truncate">
        {wallet.data?.name}
      </div>
      <button className="text-contrast"
        onClick={copyRunner.run}
        onMouseEnter={copyPopper.use}
        onMouseLeave={copyPopper.unset}>
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
      </button>
      <div className="text-contrast">
        {`${fbalance} Goerli ETH`}
      </div>
      <HoverPopper target={copyPopper}>
        {copyRunner.current
          ? `Copied ✅`
          : `Copy address`}
      </HoverPopper>
    </div>

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

  const TxHashDisplay =
    <div className="text-break">
      <div className="text-colored">
        Transaction hash:
      </div>
      <span className="text-contrast text-sm">{txHash}</span>
      <ExternalDivisionLink className="flex items-center gap-2 text-colored cursor-pointer hover:underline w-[150px]"
        href={`https://goerli.etherscan.io/tx/${txHash}`} target="no">
        <span className="text-sm">See on etherscan</span>
        <ArrowTopRightOnSquareIcon className="icon-xs" />
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
        : "Send transaction"}
    </ContainedButton>

  return <div className="h-full w-full flex flex-col">
    <div className="p-xmd w-full flex items-center">
      <button className="p-1 bg-ahover rounded-xl"
        onClick={router.back}>
        <ArrowLeftIcon className="icon-sm" />
      </button>
    </div>
    {WalletInfo}
    <div className="p-xmd">
      <div className="p-4 rounded-xl border border-contrast">
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
      </div>
    </div>
  </div>
}
