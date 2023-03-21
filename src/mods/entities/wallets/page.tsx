/* eslint-disable @next/next/no-img-element */
import { BigInts } from "@/libs/bigints/bigints";
import { Hex } from "@/libs/hex/hex";
import { HoverPopper } from "@/libs/modals/popper";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncTry } from "@/libs/react/async";
import { useInputChange } from "@/libs/react/events";
import { useBoolean } from "@/libs/react/handles/boolean";
import { useElement } from "@/libs/react/handles/element";
import { Rpc } from "@/libs/rpc";
import { Types } from "@/libs/types/types";
import { ContrastTextButton, OppositeTextButton } from "@/mods/components/button";
import { useSessions } from "@/mods/tor/sessions/context";
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { getAddress, parseUnits, Wallet } from "ethers";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { NetworkSelectionDialog } from "../../components/dialogs/networks";
import { useBalance, useGasPrice, useNonce, useWallet } from "./data";

export function WalletPage(props: { address: string }) {
  const { address } = props

  const router = useRouter()
  const sessions = useSessions()

  const wallet = useWallet(address)
  const balance = useBalance(address, sessions)
  const nonce = useNonce(address, sessions)
  const gasPrice = useGasPrice(sessions)

  const selectNetwork = useBoolean()

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

  const trySend = useAsyncTry(async () => {
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

  const Header = <>
    {selectNetwork.current && <NetworkSelectionDialog close={selectNetwork.disable} />}
    <div className="flex p-md text-colored rounded-b-xl border-b md:border-l md:border-r border-violet6 bg-violet2 justify-between">
      <ContrastTextButton className="w-[150px]">
        <img className="icon-sm md:w-16 md:h-6"
          alt="logo"
          src="/logo.svg" />
        <span className="text-sm md:text-base">
          Brume
        </span>
      </ContrastTextButton>
      <ContrastTextButton className="w-full sm:w-[250px]"
        onClick={selectNetwork.enable}>
        <span className="text-sm md:text-base">
          {"Goerli Tesnet"}
        </span>
      </ContrastTextButton>
      <ContrastTextButton className="w-[150px]">
        <span className="text-sm md:text-base">
          Tor
        </span>
        {sessions?.size // TODO else afficher loading
          ? <ShieldCheckIcon className="icon-sm md:icon-base text-grass8" />
          : <ShieldCheckIcon className="icon-sm md:icon-base text-grass8" />}
      </ContrastTextButton>
    </div>
  </>


  const fbalance = (() => {
    if (balance.error !== undefined)
      return "Error"
    if (balance.data === undefined)
      return "..."
    return BigInts.float(balance.data, 18)
  })()

  const copyPopper = useElement()
  const copied = useBoolean()

  const content = useMemo(() => {
    if (!copied.current)
      return "Copy address to clipboard"
    else
      return "Copy address successfully"
  }, [copied])

  const onCopyClick = useAsyncTry(async () => {
    await navigator.clipboard.writeText(address)
    copied.enable()
    setTimeout(() => copied.disable(), 600)
  }, [copied], console.error)

  const WalletInfo = <div className="flex flex-col items-center justify-center gap-2">
    <div className="w-full flex px-4 justify-between items-start">
      <div className="w-[50px] flex justify-center">
        <button className="p-1 bg-ahover rounded-xl" onClick={router.back}>
          <ArrowLeftIcon className="icon-xs md:icon-md" />
        </button>
      </div>
    </div>
    <HoverPopper target={copyPopper}>
      {content}
    </HoverPopper>
    <ContrastTextButton onClick={onCopyClick.run}
      onMouseEnter={copyPopper.use}
      onMouseLeave={copyPopper.unset}>
      <div className="flex flex-col items-center">
        <span className="text-xl text-colored font-bold">
          {wallet.data?.name}
        </span>
        <span className="text-contrast">
          {`${address.slice(0, 5)}...${address.slice(-5)}`}
        </span>
        <span className="text-contrast">{`${fbalance} Goerli ETH`}</span>
      </div>
    </ContrastTextButton>
  </div>

  const RecipientInput = <>
    <h3 className="text-colored md:text-lg">
      Recipient
    </h3>
    <div className="h-1" />
    <input className="py-2 px-4 bg-contrast rounded-xl w-full outline-violet6"
      value={recipientInput}
      placeholder="0x..."
      onChange={onRecipientInputChange} />
  </>

  const ValueInput = <>
    <h3 className="text-colored md:text-lg">
      Value
    </h3>
    <div className="h-1" />
    <input className="py-2 px-4 bg-contrast rounded-xl w-full outline-violet6"
      value={valueInput}
      placeholder="1.0"
      onChange={onValueInputChange} />
  </>

  const TxHashDisplay = <>
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
  </>

  const disabled = useMemo(() => {
    if (recipientInput === "") return true
    if (valueInput === "") return true
    return false
  }, [recipientInput, valueInput])

  const SendButton =
    <OppositeTextButton className="text-lg md:text-xl" disabled={disabled} onClick={trySend.run}>
      {trySend.loading
        ? "Loading..."
        : "Send transaction"}
    </OppositeTextButton>

  return <main className="h-full flex flex-col">
    {Header}
    <div className="h-4" />
    {WalletInfo}
    <div className="h-2" />
    <div className="p-md">
      {RecipientInput}
      <div className="h-4" />
      {ValueInput}
    </div>
    <div className="grow" />
    {txHash && <>
      {TxHashDisplay}
      <div className="h-2" />
    </>}
    <div className="h-1 md:h-4" />
    <div className="p-md">
      {SendButton}
    </div>
    <div className="h-1 md:h-4" />
  </main>
}
