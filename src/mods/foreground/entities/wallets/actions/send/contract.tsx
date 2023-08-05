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
import { useEffect, useMemo, useState } from "react";
import { useWalletData } from "../../context";
import { EthereumContextProps, EthereumWalletInstance, useGasPrice, useNonce, useTokenBalance } from "../../data";

export function WalletDataSendContractTokenDialog(props: TitleProps & CloseProps & EthereumContextProps & { token: ContractTokenInfo }) {
  const core = useCore().unwrap()
  const wallet = useWalletData()
  const { title, context, token, close } = props

  const balanceQuery = useTokenBalance(wallet.address, token, context)
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
      Value ({token.symbol})
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
      value={valueInput}
      placeholder="1.0"
      onChange={onValueInputChange} />
  </>

  const [nonceInput = "", setNonceInput] = useState<string>()

  const onNonceInputChange = useInputChange(e => {
    setNonceInput(e.currentTarget.value)
  }, [])

  useEffect(() => {
    if (maybeNonce == null)
      return
    setNonceInput(maybeNonce.toString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maybeNonce])

  const NonceInput = <>
    <div className="">
      Advanced: Nonce
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
      value={nonceInput}
      onChange={onNonceInputChange} />
  </>

  const [txHash, setTxHash] = useState<string>()

  const trySend = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const gasPrice = Option.wrap(maybeGasPrice).ok().throw(t)

      const signature = Cubane.Abi.FunctionSignature.tryParse("transfer(address,uint256)").throw(t)
      const data = Cubane.Abi.tryEncode(signature, ethers.getAddress(recipientInput), ethers.parseUnits(valueInput, 18)).unwrap()

      const gas = await context.background.tryRequest<string>({
        method: "brume_eth_fetch",
        params: [context.wallet.uuid, context.chain.chainId, {
          method: "eth_estimateGas",
          params: [{
            chainId: Radix.toHex(context.chain.chainId),
            from: wallet.address,
            to: token.address,
            gasPrice: Radix.toHex(gasPrice),
            nonce: Radix.toHex(Number(nonceInput)),
            data: data
          }, "latest"]
        }]
      }).then(r => r.throw(t).throw(t))

      const tx = Result.catchAndWrapSync(() => {
        return Transaction.from({
          to: token.address,
          gasLimit: gas,
          chainId: context.chain.chainId,
          gasPrice: gasPrice,
          nonce: Number(nonceInput),
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
    }).then(Results.alert)
  }, [core, context, wallet, maybeGasPrice, recipientInput, valueInput, nonceInput])

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
    if (!nonceInput)
      return true
    if (!recipientInput)
      return true
    if (!valueInput)
      return true
    return false
  }, [trySend.loading, maybeGasPrice, recipientInput, valueInput, nonceInput])

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