import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { getAddress, parseUnits, Wallet } from "ethers";
import { BigInts } from "libs/bigints/bigints";
import { alertAsJson } from "libs/errors";
import { Hex } from "libs/hex/hex";
import { ExternalDivisionLink } from "libs/next/anchor";
import { useAsyncTry } from "libs/react/async";
import { useBoolean } from "libs/react/boolean";
import { useElement } from "libs/react/element";
import { useInputChange } from "libs/react/events";
import { torrpcfetch } from "libs/tor/fetcher";
import { ActionButton } from "mods/components/actionButton";
import { ContrastTextButton, OppositeTextButton } from "mods/components/button";
import { HoverPopper } from "mods/components/modal";
import { useCircuit } from "mods/contexts/circuit/context";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useBalance, useGasPrice, useNonce, useWallet } from "./data";

export function WalletPage(props: {}) {
  const router = useRouter()
  const circuit = useCircuit()

  const [, , address] = location.hash.split("/")

  const wallet = useWallet(address)
  const balance = useBalance(address, circuit)
  const nonce = useNonce(address, circuit)
  const gasPrice = useGasPrice(circuit)

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
    if (!circuit) return

    if (!wallet.data) return
    if (!nonce.data) return
    if (!gasPrice.data) return

    const ewallet = new Wallet(wallet.data.privateKey)

    const gas = await torrpcfetch<string>({
      endpoint: "https://rpc.ankr.com/eth_goerli",
      method: "eth_estimateGas",
      params: [{
        chainId: Hex.from(5),
        from: address,
        to: getAddress(recipientInput),
        value: Hex.from(parseUnits(valueInput, 18)),
        nonce: Hex.from(nonce.data),
        gasPrice: Hex.from(gasPrice.data)
      }, "latest"]
    }, {}, circuit)

    if (gas.error) throw gas.error

    const tx = await torrpcfetch<string>({
      endpoint: "https://rpc.ankr.com/eth_goerli",
      method: "eth_sendRawTransaction",
      params: [await ewallet.signTransaction({
        chainId: 5,
        from: address,
        to: getAddress(recipientInput),
        value: parseUnits(valueInput, 18),
        nonce: Number(nonce.data),
        gasPrice: gasPrice.data,
        gasLimit: gas.data
      })]
    }, {}, circuit)

    if (tx.error !== undefined) throw tx.error

    setTxHash(tx.data)

    balance.refetch()
    nonce.refetch()
  }, [circuit, address, nonce.data, gasPrice.data, recipientInput, valueInput], alertAsJson)

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
    if (balance.error)
      return "Error"
    if (!balance.data)
      return "..."
    return BigInts.tryFloat(balance.data, 18)
  })()

  const copyPopper = useElement()
  const copied = useBoolean()
  const content = useMemo(() => {
    if (!copied.current) return "Copy address to clipboard"
    return "Copy address successfully"
  }, [copied])

  const error = ((e: any) => {
    return
  })

  const onCopyClick = useAsyncTry(async () => {
    await navigator.clipboard.writeText(address)
    copied.enable()
    setTimeout(() => copied.disable(), 600)
  }, [copied], error)

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
            {wallet!.data!.name}
          </span>
          <span className="text-contrast">
            {`${address.slice(0, 5)}...${address.slice(-5)}`}
          </span>
          <span className="text-contrast">{`${fbalance} Goerli ETH`}</span>
        </div>
      </ContrastTextButton>
      <div className="w-[50px] flex justify-center">
        <div className="p-1">
          <img className="w-6 h-4"
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