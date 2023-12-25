import { BigIntToHex, BigInts } from "@/libs/bigints/bigints";
import { UIError } from "@/libs/errors/errors";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { ExternalDivisionLink } from "@/libs/next/anchor";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { TitleProps } from "@/libs/react/props/title";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog, useDialogContext } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { ContractTokenData } from "@/mods/background/service_worker/entities/tokens/data";
import { Address, Cubane, Fixed, ZeroHexString } from "@hazae41/cubane";
import { Option } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { Transaction, ethers } from "ethers";
import { useDeferredValue, useMemo, useState } from "react";
import { useBlockByNumber } from "../../../blocks/data";
import { useEnsLookup } from "../../../names/data";
import { useContractBalance, useGasPrice, useMaxPriorityFeePerGas, useNonce } from "../../../unknown/data";
import { useWalletDataContext } from "../../context";
import { EthereumContextProps, EthereumWalletInstance, useEthereumContext } from "../../data";

export function WalletDataSendContractTokenDialog(props: TitleProps & EthereumContextProps & { token: ContractTokenData }) {
  const { close } = useDialogContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const { title, context, token } = props

  const mainnet = useEthereumContext(wallet.uuid, chainByChainId[1])

  const balanceQuery = useContractBalance(wallet.address, token, context, [])
  const pendingNonceQuery = useNonce(wallet.address, context)
  const gasPriceQuery = useGasPrice(context)
  const maxPriorityFeePerGasQuery = useMaxPriorityFeePerGas(context)

  const pendingBlockQuery = useBlockByNumber("pending", context)
  const maybePendingBlock = pendingBlockQuery.data?.inner

  const [rawRecipientInput = "", setRawRecipientInput] = useState<string>()

  const defRecipientInput = useDeferredValue(rawRecipientInput)

  const onRecipientInputChange = useInputChange(e => {
    setRawRecipientInput(e.currentTarget.value)
  }, [])

  const maybeEnsName = defRecipientInput.endsWith(".eth")
    ? defRecipientInput
    : undefined
  const ensAddressQuery = useEnsLookup(maybeEnsName, mainnet)

  const maybeFinalAddress = defRecipientInput.endsWith(".eth")
    ? ensAddressQuery.data?.inner
    : defRecipientInput

  const RecipientInput = <>
    <div className="">
      Recipient
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
      value={rawRecipientInput}
      placeholder="brume.eth"
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
      Custom nonce
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
      value={rawNonceInput}
      onChange={onNonceInputChange} />
  </>

  const [txHash, setTxHash] = useState<string>()

  const trySend = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const maybeNonce = await BigInts.tryParse(defNonceInput).ok().orElse(async () => {
        return await Result.unthrow<Result<bigint, Error>>(async t => {
          return new Ok(await pendingNonceQuery.refetch().then(r => r.real!.current.throw(t)))
        }).then(r => r.ok())
      }).then(o => o.inner)

      const nonce = Option.wrap(maybeNonce).okOrElseSync(() => {
        return new UIError(`Could not fetch or parse nonce`)
      }).throw(t)

      const address = Option.wrap(maybeFinalAddress).okOrElseSync(() => {
        return new UIError(`Could not fetch or parse address`)
      }).throw(t)

      const pendingBlock = Option.wrap(maybePendingBlock).okOrElseSync(() => {
        return new UIError(`Could not fetch pending block`)
      }).throw(t)

      const signature = Cubane.Abi.FunctionSignature.tryParse("transfer(address,uint256)").throw(t)
      const fixed = Fixed.fromString(defValueInput, token.decimals)
      const args = signature.from(Address.from(address), fixed.value)
      const data = Cubane.Abi.tryEncode(args).throw(t)

      let tx: ethers.Transaction

      /**
      * EIP-1559
      */
      if (pendingBlock.baseFeePerGas != null) {
        const maxPriorityFeePerGas = await Result.unthrow<Result<bigint, Error>>(async t => {
          return new Ok(await maxPriorityFeePerGasQuery.refetch().then(r => r.real!.current.throw(t)))
        }).then(r => r.mapErrSync(() => {
          return new UIError(`Could not fetch maxPriorityFeePerGas`)
        }).throw(t))

        const baseFeePerGas = BigIntToHex.decodeOrThrow(pendingBlock.baseFeePerGas)
        const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas

        const gas = await context.background.tryRequest<string>({
          method: "brume_eth_fetch",
          params: [context.uuid, context.chain.chainId, {
            method: "eth_estimateGas",
            params: [{
              chainId: ZeroHexString.from(context.chain.chainId),
              from: wallet.address,
              to: token.address,
              maxFeePerGas: ZeroHexString.from(maxFeePerGas),
              maxPriorityFeePerGas: ZeroHexString.from(maxPriorityFeePerGas),
              nonce: ZeroHexString.from(nonce),
              data: data
            }, "latest"],
            noCheck: true
          }]
        }).then(r => r.throw(t).throw(t))

        tx = Result.runAndDoubleWrapSync(() => {
          return Transaction.from({
            to: token.address,
            gasLimit: gas,
            chainId: context.chain.chainId,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            nonce: Number(nonce),
            data: data
          })
        }).throw(t)
      }

      /**
       * Not EIP-1559
       */
      else {
        const gasPrice = await Result.unthrow<Result<bigint, Error>>(async t => {
          return new Ok(await gasPriceQuery.refetch().then(r => r.real!.current.throw(t)))
        }).then(r => r.mapErrSync(() => {
          return new UIError(`Could not fetch gasPrice`)
        }).throw(t))

        const gas = await context.background.tryRequest<string>({
          method: "brume_eth_fetch",
          params: [context.uuid, context.chain.chainId, {
            method: "eth_estimateGas",
            params: [{
              chainId: ZeroHexString.from(context.chain.chainId),
              from: wallet.address,
              to: token.address,
              gasPrice: ZeroHexString.from(gasPrice),
              nonce: ZeroHexString.from(nonce),
              data: data
            }, "latest"],
            noCheck: true
          }]
        }).then(r => r.throw(t).throw(t))

        tx = Result.runAndDoubleWrapSync(() => {
          return Transaction.from({
            to: token.address,
            gasLimit: gas,
            chainId: context.chain.chainId,
            gasPrice: gasPrice,
            nonce: Number(nonce),
            data: data
          })
        }).throw(t)
      }

      const instance = await EthereumWalletInstance.tryFrom(wallet, context.background).then(r => r.throw(t))
      tx.signature = await instance.trySignTransaction(tx, context.background).then(r => r.throw(t))

      const txHash = await context.background.tryRequest<string>({
        method: "brume_eth_fetch",
        params: [context.uuid, context.chain.chainId, {
          method: "eth_sendRawTransaction",
          params: [tx.serialized],
          noCheck: true
        }]
      }).then(r => r.throw(t).throw(t))

      setTxHash(txHash)

      balanceQuery.refetch()
      pendingNonceQuery.refetch()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [context, wallet, maybePendingBlock, defNonceInput, maybeFinalAddress, defValueInput])

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
        <div className={`${Button.Shrinker.className}`}>
          <Outline.ArrowTopRightOnSquareIcon className="size-5" />
          Etherscan
        </div>
      </Button.Gradient>
    </ExternalDivisionLink>
  </>

  const sendDisabled = useMemo(() => {
    if (trySend.loading)
      return "Loading..."
    if (!defRecipientInput)
      return "Please enter a recipient"
    if (!defValueInput)
      return "Please enter an amount"
    return undefined
  }, [trySend.loading, defRecipientInput, defValueInput])

  const SendButton =
    <Button.Gradient className="w-full po-md"
      colorIndex={wallet.color}
      disabled={Boolean(sendDisabled)}
      onClick={trySend.run}>
      <div className={`${Button.Shrinker.className}`}>
        <Outline.PaperAirplaneIcon className="size-5" />
        {sendDisabled || "Send"}
      </div>
    </Button.Gradient>

  return <>
    <Dialog.Title close={close}>
      Send {title}
    </Dialog.Title>
    <div className="h-2" />
    {RecipientInput}
    <div className="h-2" />
    {ValueInput}
    <div className="h-4" />
    {NonceInput}
    <div className="h-4" />
    {txHash ? <>
      {TxHashDisplay}
    </> : <>
      {SendButton}
    </>}
  </>
}