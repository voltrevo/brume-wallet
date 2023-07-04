import { Radix } from "@/libs/hex/hex";
import { Outline } from "@/libs/icons/icons";
import { Dialog, DialogTitle } from "@/libs/modals/dialog";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { TitleProps } from "@/libs/react/props/title";
import { Err, Ok, Result } from "@hazae41/result";
import { ethers } from "ethers";
import { useMemo, useState } from "react";
import { GradientButton } from "../../../../../pages/components/buttons/gradient";
import { InnerButton } from "../../../../../pages/components/buttons/naked";
import { useWalletData } from "./context";
import { EthereumContextProps, useGasPrice, useNonce, usePendingBalance } from "./data";

export function WalletDataSendDialog(props: TitleProps & CloseProps & EthereumContextProps) {
  const wallet = useWalletData()
  const { title, handle, close } = props

  const balance = usePendingBalance(wallet.address, handle)
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
      if (nonce.data == null)
        return new Err(new Error(`Invalid nonce`))
      if (gasPrice.data == null)
        return new Err(new Error(`Invalid gas price`))

      const gas = await handle.background.tryRequest<string>({
        method: "brume_call_ethereum",
        params: [handle.wallet.uuid, handle.chain.chainId, {
          method: "eth_estimateGas",
          params: [{
            chainId: Radix.toHex(handle.chain.chainId),
            from: wallet.address,
            to: ethers.getAddress(recipientInput),
            value: Radix.toHex(ethers.parseUnits(valueInput, 18)),
            nonce: Radix.toHex(nonce.data.inner),
            gasPrice: Radix.toHex(gasPrice.data.inner)
          }, "latest"]
        }]
      }).then(r => r.throw(t).throw(t))

      const txHash = await handle.background.tryRequest<string>({
        method: "brume_call_ethereum",
        params: [handle.wallet.uuid, handle.chain.chainId, {
          method: "eth_sendTransaction",
          params: [{
            chainId: Radix.toHex(handle.chain.chainId),
            from: wallet.address,
            to: ethers.getAddress(recipientInput),
            value: Radix.toHex(ethers.parseUnits(valueInput, 18)),
            nonce: Radix.toHex(nonce.data.inner),
            gasPrice: Radix.toHex(gasPrice.data.inner),
            gas: gas
          }]
        }]
      }).then(r => r.throw(t).throw(t))

      setTxHash(txHash)
      setError(undefined)

      balance.refetch()
      nonce.refetch()

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
        colorIndex={wallet.color}>
        <InnerButton icon={Outline.ArrowTopRightOnSquareIcon}>
          Etherscan
        </InnerButton>
      </GradientButton>
    </ExternalDivisionLink>
  </>

  const disabled = useMemo(() => {
    if (nonce.data == null)
      return true
    if (gasPrice.data == null)
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
      onClick={trySend.run}>
      <InnerButton icon={Outline.PaperAirplaneIcon}>
        {trySend.loading
          ? "Loading..."
          : "Send"}
      </InnerButton>
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