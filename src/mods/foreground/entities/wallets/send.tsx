import { Ethers } from "@/libs/ethers/ethers";
import { Radix } from "@/libs/hex/hex";
import { Outline } from "@/libs/icons/icons";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { TitleProps } from "@/libs/react/props/title";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { Option } from "@hazae41/option";
import { Err, Ok, Result } from "@hazae41/result";
import { ethers } from "ethers";
import { useMemo, useState } from "react";
import { useWalletData } from "./context";
import { EthereumContextProps, Wallets, useGasPrice, useNonce, usePendingBalance } from "./data";

export function WalletDataSendDialog(props: TitleProps & CloseProps & EthereumContextProps) {
  const wallet = useWalletData()
  const { title, context, close } = props

  const balanceQuery = usePendingBalance(wallet.address, context)
  const maybeBalance = balanceQuery.data?.inner

  const nonceQuery = useNonce(wallet.address, context)
  const maybeNonce = nonceQuery.data?.inner

  const gasPriceQuery = useGasPrice(context)
  const maybeGasPrice = gasPriceQuery.data?.inner

  const [recipientInput = "", setRecipientInput] = useState<string>()

  const onRecipientInputChange = useInputChange(e => {
    setRecipientInput(e.currentTarget.value)
  }, [])

  const RecipientInput = <>
    <div className="">
      Recipient
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
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
    <Input.Contrast className="w-full"
      value={valueInput}
      placeholder="1.0"
      onChange={onValueInputChange} />
  </>

  const [error, setError] = useState<Error>()
  const [txHash, setTxHash] = useState<string>()

  const trySend = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const gasPrice = Option.wrap(maybeGasPrice).ok().throw(t)
      const nonce = Option.wrap(maybeNonce).ok().throw(t)

      if (wallet.type === "readonly")
        return new Err(new Error(`This wallet is readonly`))

      const privateKey = await Wallets.tryGetPrivateKey(wallet, context.background).then(r => r.throw(t))

      const ewallet = Ethers.Wallet.tryFrom(privateKey).throw(t)

      const gas = await context.background.tryRequest<string>({
        method: "brume_eth_fetch",
        params: [context.wallet.uuid, context.chain.chainId, {
          method: "eth_estimateGas",
          params: [{
            chainId: Radix.toHex(context.chain.chainId),
            from: wallet.address,
            to: ethers.getAddress(recipientInput),
            gasPrice: Radix.toHex(gasPrice),
            value: Radix.toHex(ethers.parseUnits(valueInput, 18)),
            nonce: Radix.toHex(nonce)
          }, "latest"]
        }]
      }).then(r => r.throw(t).throw(t))

      const signature = await Result.catchAndWrap(async () => {
        return await ewallet.signTransaction({
          to: ethers.getAddress(recipientInput),
          from: wallet.address,
          gasLimit: gas,
          chainId: context.chain.chainId,
          gasPrice: gasPrice,
          nonce: Number(nonce),
          value: ethers.parseUnits(valueInput, 18)
        })
      }).then(r => r.throw(t))

      const txHash = await context.background.tryRequest<string>({
        method: "brume_eth_fetch",
        params: [context.wallet.uuid, context.chain.chainId, {
          method: "eth_sendRawTransaction",
          params: [signature]
        }]
      }).then(r => r.throw(t).throw(t))

      setTxHash(txHash)
      setError(undefined)

      balanceQuery.refetch()
      nonceQuery.refetch()

      return Ok.void()
    }).then(r => r.inspectErrSync(setError).ignore())
  }, [context, wallet, maybeNonce, maybeGasPrice, recipientInput, valueInput])

  const TxHashDisplay = <>
    <div className="">
      Transaction hash
    </div>
    <div className="text-contrast truncate">
      {txHash}
    </div>
    <div className="h-2" />
    <ExternalDivisionLink className="w-full"
      href={`${context.chain.etherscan}/tx/${txHash}`}
      target="_blank" rel="noreferrer">
      <Button.Gradient className="w-full po-md"
        colorIndex={wallet.color}>
        <Button.Shrink>
          <Outline.ArrowTopRightOnSquareIcon className="s-sm" />
          Etherscan
        </Button.Shrink>
      </Button.Gradient>
    </ExternalDivisionLink>
  </>

  const disabled = useMemo(() => {
    if (trySend.loading)
      return true
    if (maybeNonce == null)
      return true
    if (maybeGasPrice == null)
      return true
    if (!recipientInput)
      return true
    if (!valueInput)
      return true
    return false
  }, [trySend.loading, maybeNonce, maybeGasPrice, recipientInput, valueInput])

  const SendButton =
    <Button.Gradient className="w-full po-md"
      colorIndex={wallet.color}
      disabled={disabled}
      onClick={trySend.run}>
      <Button.Shrink>
        <Outline.PaperAirplaneIcon className="s-sm" />
        {trySend.loading
          ? "Loading..."
          : "Send"}
      </Button.Shrink>
    </Button.Gradient>

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      Send {title}
    </Dialog.Title>
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