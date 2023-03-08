import { BigInts } from "@/libs/bigints/bigints";
import { Hex } from "@/libs/hex/hex";
import { HoverPopper } from "@/libs/modals/popper";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { Img } from "@/libs/next/image";
import { useAsyncTry } from "@/libs/react/async";
import { useInputChange } from "@/libs/react/events";
import { useBoolean } from "@/libs/react/handles/boolean";
import { useElement } from "@/libs/react/handles/element";
import { Rpc } from "@/libs/rpc";
import { ActionButton } from "@/mods/components/action";
import { ContrastTextButton, OppositeTextButton } from "@/mods/components/button";
import { useSessions } from "@/mods/tor/sessions/context";
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { getAddress, parseUnits, Wallet } from "ethers";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
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

  const trySend = useAsyncTry(async () => {
    if (!wallet.data) return

    if (!BigInts.is(nonce.data)) return
    if (!BigInts.is(gasPrice.data)) return

    const session = await sessions.random()

    const ethers_wallet = new Wallet(wallet.data.privateKey)

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
      params: [await ethers_wallet.signTransaction({
        chainId: 5,
        from: address,
        to: getAddress(recipientInput),
        value: parseUnits(valueInput, 18),
        nonce: Number(nonce.data),
        gasPrice: gasPrice.data,
        gasLimit: gasRes.result
      })]
    })

    const txRes = await Rpc.fetchWithSocket<string>(txReq, session.socket)

    if (txRes.error !== undefined) throw txRes.error

    setTxHash(txRes.result)

    balance.refetch()
    nonce.refetch()
  }, [sessions, address, nonce.data, gasPrice.data, recipientInput, valueInput], console.error)

  const Header = <div className="flex p-md text-colored rounded-b-xl border-b border-violet6 bg-violet2 justify-between">
    <ContrastTextButton className="w-[100px]">
      <span className="text-xs">
        Tor
      </span>
      <ShieldCheckIcon className="icon-xs text-grass8" />
    </ContrastTextButton>
    <ContrastTextButton className="w-full">
      <span className="text-xs">
        {"Goerli Tesnet"}
      </span>
    </ContrastTextButton>
    <ContrastTextButton className="w-[100px]">
      <span className="text-xs">
        V 0.1
      </span>
    </ContrastTextButton>
  </div>


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
          <ArrowLeftIcon className="icon-xs" />
        </button>
      </div>
      <HoverPopper target={copyPopper}>
        {content}
      </HoverPopper>
      <ContrastTextButton onClick={onCopyClick.run}
        onMouseEnter={copyPopper.use}
        onMouseLeave={copyPopper.unset}>
        <div className="flex flex-col items-center">
          <span className="text-xl text-colored">
            {wallet.data?.name}
          </span>
          <span className="text-contrast">
            {`${address.slice(0, 5)}...${address.slice(-5)}`}
          </span>
          <span className="text-contrast">{`${fbalance} Goerli ETH`}</span>
        </div>
      </ContrastTextButton>
      <div className="w-[50px] flex justify-center">
        <div className="p-1">
          <Img className="w-6 h-4"
            src="logo.svg" alt="logo" />
        </div>
      </div>
    </div>
    <div className="h-1" />
    <ActionButton />
  </div>

  const RecipientInput = <>
    <h3 className="text-colored">
      Recipient
    </h3>
    <input className="py-2 px-4 bg-contrast rounded-xl w-full outline-violet6"
      value={recipientInput}
      placeholder="0x..."
      onChange={onRecipientInputChange} />
  </>

  const ValueInput = <>
    <h3 className="text-colored">
      Value
    </h3>
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
    <OppositeTextButton disabled={disabled} onClick={trySend.run}>
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
      <div className="h-2" />
      {ValueInput}
    </div>
    <div className="grow" />
    {txHash && <>
      {TxHashDisplay}
      <div className="h-2" />
    </>}
    <div className="p-md">
      {SendButton}
    </div>
    <div className="h-1" />
  </main>
}