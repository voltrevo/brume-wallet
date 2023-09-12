import { ContractTokenInfo } from "@/libs/ethereum/mods/chain";
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
import { Cubane } from "@hazae41/cubane";
import { Option } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { useCore } from "@hazae41/xswr";
import { Transaction, ethers } from "ethers";
import { useDeferredValue, useMemo, useState } from "react";
import { useWalletData } from "../../context";
import { EthereumContextProps, EthereumWalletInstance, useGasPrice, useNonce, useTokenBalance } from "../../data";

export function WalletDataSendContractTokenDialog(props: TitleProps & CloseProps & EthereumContextProps & { token: ContractTokenInfo }) {
  const core = useCore().unwrap()
  const wallet = useWalletData()
  const { title, context, token, close } = props

  const balanceQuery = useTokenBalance(wallet.address, token, context, [])
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
      Value ({token.symbol})
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
      value={rawValueInput}
      placeholder="1.0"
      onChange={onValueInputChange} />
  </>

  const [rawNonceInput = "", setRawNonceInput] = useState<string>()

  const defNonceInput = useDeferredValue(rawNonceInput)

  const onNonceInputChange = useInputChange(e => {
    setRawNonceInput(e.currentTarget.value)
  }, [])

  const NonceInput = <>
    <div className="">
      Advanced: Nonce
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
      value={rawNonceInput}
      onChange={onNonceInputChange} />
  </>

  const [txHash, setTxHash] = useState<string>()

  const trySend = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const gasPrice = Option.wrap(maybeGasPrice).ok().throw(t)

      const signature = Cubane.Abi.FunctionSignature.tryParse("transfer(address,uint256)").throw(t)
      const data = Cubane.Abi.tryEncode(signature, ethers.getAddress(defRecipientInput), ethers.parseUnits(defValueInput, 18)).unwrap()

      const gas = await context.background.tryRequest<string>({
        method: "brume_eth_fetch",
        params: [context.wallet.uuid, context.chain.chainId, {
          method: "eth_estimateGas",
          params: [{
            chainId: Radix.toZeroHex(context.chain.chainId),
            from: wallet.address,
            to: token.address,
            gasPrice: Radix.toZeroHex(gasPrice),
            nonce: Radix.toZeroHex(Number(defNonceInput)),
            data: data
          }, "latest"]
        }]
      }).then(r => r.throw(t).throw(t))

      const tx = Result.runAndDoubleWrapSync(() => {
        return Transaction.from({
          to: token.address,
          gasLimit: gas,
          chainId: context.chain.chainId,
          gasPrice: gasPrice,
          nonce: Number(defNonceInput),
          data: data
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
    }).then(Results.logAndAlert)
  }, [core, context, wallet, maybeGasPrice, defRecipientInput, defValueInput, defNonceInput])

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
    if (maybeGasPrice == null)
      return true
    if (!defNonceInput)
      return true
    if (!defRecipientInput)
      return true
    if (!defValueInput)
      return true
    return false
  }, [trySend.loading, maybeGasPrice, defRecipientInput, defValueInput, defNonceInput])

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