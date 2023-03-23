/* eslint-disable @next/next/no-img-element */
import { BigInts } from "@/libs/bigints/bigints";
import { useCopy } from "@/libs/copy/copy";
import { Hex } from "@/libs/hex/hex";
import { HoverPopper } from "@/libs/modals/popper";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/async";
import { useInputChange } from "@/libs/react/events";
import { useElement } from "@/libs/react/handles/element";
import { Rpc } from "@/libs/rpc";
import { Types } from "@/libs/types/types";
import { ContrastTextButton, OppositeTextButton } from "@/mods/components/button";
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
    <div className="flex flex-col items-center">
      <WalletAvatar
        size={5}
        textSize={3}
        address={address} />
      <div className="h-2" />
      <div className="text-xl font-medium max-w-[200px] truncate">
        {wallet.data?.name}
      </div>
      <ContrastTextButton className="px-2 py-0">
        <span className="text-contrast"
          onClick={copyRunner.run}
          onMouseEnter={copyPopper.use}
          onMouseLeave={copyPopper.unset}>
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
      </ContrastTextButton>
      <span className="text-contrast">
        {`${fbalance} Goerli ETH`}
      </span>
      <HoverPopper target={copyPopper}>
        {copyRunner.current
          ? `Address copied ✅`
          : `Copy address`}
      </HoverPopper>
    </div>

  const RecipientInput = <>
    <h3 className="text-colored">
      Recipient
    </h3>
    <div className="h-1" />
    <input className="py-2 px-4 bg-contrast rounded-xl w-full outline-violet6"
      value={recipientInput}
      placeholder="0x..."
      onChange={onRecipientInputChange} />
  </>

  const ValueInput = <>
    <h3 className="text-colored">
      Value
    </h3>
    <div className="h-1" />
    <input className="py-2 px-4 bg-contrast rounded-xl w-full outline-violet6"
      value={valueInput}
      placeholder="1.0"
      onChange={onValueInputChange} />
  </>

  const TxHashDisplay =
    <div className="text-break p-md">
      <div>
        <span className="text-colored">Transaction hash:</span>
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
    <OppositeTextButton className="text-lg" disabled={disabled} onClick={trySend.run}>
      {trySend.loading
        ? "Loading..."
        : "Send transaction"}
    </OppositeTextButton>

  return <div className="h-full w-full flex flex-col">
    <div className="w-full flex items-center">
      <button className="p-1 bg-ahover rounded-xl"
        onClick={router.back}>
        <ArrowLeftIcon className="icon-sm" />
      </button>
    </div>
    {WalletInfo}
    <div className="h-4" />
    {RecipientInput}
    <div className="h-4" />
    {ValueInput}
    <div className="grow" />
    {txHash && <>
      {TxHashDisplay}
      <div className="h-2" />
    </>}
    <div className="h-1" />
    {SendButton}
  </div>
}
