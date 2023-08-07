import { Radix } from "@/libs/hex/hex";
import { Outline } from "@/libs/icons/icons";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { TitleProps } from "@/libs/react/props/title";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { Option } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { useCore } from "@hazae41/xswr";
import { Transaction, ethers } from "ethers";
import { useDeferredValue, useMemo, useState } from "react";
import { useWalletData } from "../../context";
import { EthereumContextProps, EthereumWalletInstance, useBalance, useGasPrice, useNonce } from "../../data";

export function WalletDataSendNativeTokenDialog(props: TitleProps & CloseProps & EthereumContextProps) {
  const core = useCore().unwrap()
  const wallet = useWalletData()
  const { title, context, close } = props

  const balanceQuery = useBalance(wallet.address, context, [])
  const maybeBalance = balanceQuery.data?.inner

  const nonceQuery = useNonce(wallet.address, context)
  const maybeNonce = nonceQuery.data?.inner

  const gasPriceQuery = useGasPrice(context)
  const maybeGasPrice = gasPriceQuery.data?.inner

  const [rawRecipientInput = "", setRawRecipientInput] = useState<string>()

  const defRecipientInput = useDeferredValue(rawRecipientInput)

  const onRecipientInputChange = useInputChange(e => {
    setRawRecipientInput(e.currentTarget.value)
  }, [])

  const RecipientInput = <>
    <div className="">
      Recipient
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
      value={rawRecipientInput}
      placeholder="0x..."
      onChange={onRecipientInputChange} />
  </>

  const [rawValueInput = "", setRawValueInput] = useState<string>()

  const defValueInput = useDeferredValue(rawValueInput)

  const onValueInputChange = useInputChange(e => {
    const value = e.currentTarget.value
      .replaceAll(/[^\d.,]/g, "")
      .replaceAll(",", ".")
    setRawValueInput(value)
  }, [])

  const ValueInput = <>
    <div className="">
      Value ({context.chain.token.symbol})
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
      value={rawValueInput}
      placeholder="1.0"
      onChange={onValueInputChange} />
  </>

  const [txHash, setTxHash] = useState<string>()

  const trySend = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const gasPrice = Option.wrap(maybeGasPrice).ok().throw(t)
      const nonce = Option.wrap(maybeNonce).ok().throw(t)

      const gas = await context.background.tryRequest<string>({
        method: "brume_eth_fetch",
        params: [context.wallet.uuid, context.chain.chainId, {
          method: "eth_estimateGas",
          params: [{
            chainId: Radix.toHex(context.chain.chainId),
            from: wallet.address,
            to: ethers.getAddress(defRecipientInput),
            gasPrice: Radix.toHex(gasPrice),
            value: Radix.toHex(ethers.parseUnits(defValueInput, 18)),
            nonce: Radix.toHex(nonce)
          }, "latest"]
        }]
      }).then(r => r.throw(t).throw(t))

      const tx = Result.catchAndWrapSync(() => {
        return Transaction.from({
          to: ethers.getAddress(defRecipientInput),
          gasLimit: gas,
          chainId: context.chain.chainId,
          gasPrice: gasPrice,
          nonce: Number(nonce),
          value: ethers.parseUnits(defValueInput, 18)
        })
      }).throw(t)

      const instance = await EthereumWalletInstance.tryFrom(wallet, core, context.background).then(r => r.throw(t))
      tx.signature = await instance.trySignTransaction(tx, core, context.background).then(r => r.throw(t))

      const txHash = await context.background.tryRequest<string>({
        method: "brume_eth_fetch",
        params: [context.wallet.uuid, context.chain.chainId, {
          method: "eth_sendRawTransaction",
          params: [tx.serialized]
        }]
      }).then(r => r.throw(t).throw(t))

      setTxHash(txHash)

      balanceQuery.refetch()
      nonceQuery.refetch()

      return Ok.void()
    }).then(Results.alert)
  }, [core, context, wallet, maybeNonce, maybeGasPrice, defRecipientInput, defValueInput])

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
    if (!defRecipientInput)
      return true
    if (!defValueInput)
      return true
    return false
  }, [trySend.loading, maybeNonce, maybeGasPrice, defRecipientInput, defValueInput])

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
    {txHash ? <>
      {TxHashDisplay}
    </> : <>
      {SendButton}
    </>}
  </Dialog>
}