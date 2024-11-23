import { ERC20Abi } from "@/libs/abi/erc20.abi";
import { PeanutAbi } from "@/libs/abi/peanut.abi";
import { useCopy } from "@/libs/copy/copy";
import { chainDataByChainId, tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { nto } from "@/libs/ntu";
import { Peanut } from "@/libs/peanut";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog } from "@/libs/ui/dialog";
import { AnchorShrinkerDiv } from "@/libs/ui/shrinker";
import { urlOf } from "@/libs/url/url";
import { randomUUID } from "@/libs/uuid/uuid";
import { useTransactionTrial, useTransactionWithReceipt } from "@/mods/foreground/entities/transactions/data";
import { useContractTokenBalance, useContractTokenPricedBalance } from "@/mods/universal/ethereum/mods/tokens/mods/balance/hooks";
import { useContractTokenPriceV3 } from "@/mods/universal/ethereum/mods/tokens/mods/price/hooks";
import { Base16 } from "@hazae41/base16";
import { Bytes } from "@hazae41/bytes";
import { HashSubpathProvider, useHashSubpath, usePathContext, useSearchState } from "@hazae41/chemin";
import { Abi, Address, Fixed, ZeroHexString } from "@hazae41/cubane";
import { Cursor } from "@hazae41/cursor";
import { Keccak256 } from "@hazae41/keccak256";
import { Option, Optional } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { Result } from "@hazae41/result";
import { Secp256k1 } from "@hazae41/secp256k1";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { RoundedShrinkableNakedButton, ShrinkableContrastButtonInInputBox, SimpleInput, SimpleLabel, WideShrinkableOppositeButton } from "..";
import { useToken } from "../../../../tokens/data";
import { useWalletDataContext } from "../../../context";
import { useEthereumContext } from "../../../data";
import { TransactionCard, WalletTransactionDialog } from "../../eth_sendTransaction";

export function WalletPeanutSendScreenContractValue(props: {}) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const close = useCloseContext().getOrThrow()

  const hash = useHashSubpath(path)

  const [maybeStep, setStep] = useSearchState(path, "step")
  const [maybeChain, setChain] = useSearchState(path, "chain")
  const [maybeToken, setToken] = useSearchState(path, "token")
  const [maybeValue, setValue] = useSearchState(path, "value")
  const [maybePassword, setPassword] = useSearchState(path, "password")
  const [maybeTrial0, setTrial0] = useSearchState(path, "trial0")
  const [maybeTrial1, setTrial1] = useSearchState(path, "trial1")

  const trial0UuidFallback = useConstant(() => randomUUID())
  const trial0Uuid = Option.wrap(maybeTrial0).getOr(trial0UuidFallback)

  useEffect(() => {
    if (maybeTrial0 === trial0Uuid)
      return
    setTrial0(trial0Uuid)
  }, [maybeTrial0, setTrial0, trial0Uuid])

  const trial1UuidFallback = useConstant(() => randomUUID())
  const trial1Uuid = Option.wrap(maybeTrial1).getOr(trial1UuidFallback)

  useEffect(() => {
    if (maybeTrial1 === trial1Uuid)
      return
    setTrial1(trial1Uuid)
  }, [maybeTrial1, setTrial1, trial1Uuid])

  const chain = Option.wrap(maybeChain).getOrThrow()
  const chainData = chainDataByChainId[Number(chain)]

  const tokenQuery = useToken(chainData.chainId, maybeToken)
  const maybeTokenData = Option.wrap(tokenQuery.current?.getOrNull())
  const maybeTokenDef = Option.wrap(tokenByAddress[maybeToken as any])
  const tokenData = maybeTokenData.or(maybeTokenDef).getOrThrow()

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const priceQuery = useContractTokenPriceV3(context, tokenData.address, "pending")
  const maybePrice = priceQuery.current?.mapSync(Fixed.from).getOrNull()

  const [rawValuedInput = "", setRawValuedInput] = useState(nto(maybeValue))
  const [rawPricedInput = "", setRawPricedInput] = useState<Optional<string>>()

  const valuedInput = useDeferredValue(rawValuedInput)

  const getRawPricedInput = useCallback((rawValuedInput: string) => {
    try {
      if (rawValuedInput.trim().length === 0)
        return undefined

      if (maybePrice == null)
        return undefined

      const priced = Fixed.fromStringOrZeroHex(rawValuedInput, tokenData.decimals).mul(maybePrice)

      if (priced.value === 0n)
        return undefined

      return priced.toString()
    } catch (e: unknown) {
      return undefined
    }
  }, [maybePrice, tokenData])

  const getRawValuedInput = useCallback((rawPricedInput: string) => {
    try {
      if (rawPricedInput.trim().length === 0)
        return undefined

      if (maybePrice == null)
        return undefined

      const valued = Fixed.fromStringOrZeroHex(rawPricedInput, tokenData.decimals).div(maybePrice)

      if (valued.value === 0n)
        return undefined

      return valued.toString()
    } catch (e: unknown) {
      return undefined
    }
  }, [maybePrice, tokenData])

  const onValuedChange = useCallback((input: string) => {
    setRawPricedInput(getRawPricedInput(input))
  }, [getRawPricedInput])

  const onPricedChange = useCallback((input: string) => {
    setRawValuedInput(getRawValuedInput(input))
  }, [getRawValuedInput])

  const setRawValued = useCallback((input: string) => {
    setRawValuedInput(input)
    onValuedChange(input)
  }, [onValuedChange])

  const setRawPriced = useCallback((input: string) => {
    setRawPricedInput(input)
    onPricedChange(input)
  }, [onPricedChange])

  const onValuedInputChange = useInputChange(e => {
    setRawValued(e.target.value)
  }, [setRawValued])

  const onPricedInputChange = useInputChange(e => {
    setRawPriced(e.target.value)
  }, [setRawPriced])

  useEffect(() => {
    if (maybePrice == null)
      return
    onValuedChange(valuedInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maybePrice])

  useEffect(() => {
    setValue(valuedInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuedInput])

  const [mode, setMode] = useState<"valued" | "priced">("valued")

  const valuedBalanceQuery = useContractTokenBalance(context, tokenData.address, wallet.address, "pending")
  const pricedBalanceQuery = useContractTokenPricedBalance(context, tokenData.address, wallet.address, "usd", "pending")

  const valuedBalanceData = valuedBalanceQuery.current?.getOrNull()
  const pricedBalanceData = pricedBalanceQuery.current?.getOrNull()

  const onValueMaxClick = useCallback(() => {
    if (valuedBalanceData == null)
      return
    setRawValued(Fixed.from(valuedBalanceData).toString())
  }, [valuedBalanceData, setRawValued])

  const onPricedMaxClick = useCallback(() => {
    if (pricedBalanceData == null)
      return
    setRawPriced(Fixed.from(pricedBalanceData).toString())
  }, [pricedBalanceData, setRawPriced])

  const onValuedPaste = useCallback(async () => {
    setRawValued(await navigator.clipboard.readText())
  }, [setRawValued])

  const onPricedPaste = useCallback(async () => {
    setRawPriced(await navigator.clipboard.readText())
  }, [setRawPriced])

  const onValuedClear = useCallback(async () => {
    setRawValued("")
  }, [setRawValued])

  const onPricedClear = useCallback(async () => {
    setRawPriced("")
  }, [setRawPriced])

  const onTargetFocus = useCallback(() => {
    setStep("target")
  }, [setStep])

  const onPricedClick = useCallback(() => {
    setMode("priced")
  }, [])

  const onValuedClick = useCallback(() => {
    setMode("valued")
  }, [])

  const maybeContract = useMemo(() => {
    return Peanut.contracts[chainData.chainId]?.v4 as ZeroHexString | undefined
  }, [chainData])

  const password = useMemo(() => {
    if (maybePassword != null)
      return maybePassword

    const byte = new Uint8Array(1)
    const bytes = new Uint8Array(32)
    const cursor = new Cursor(bytes)

    function isAlphanumeric(byte: number) {
      if (byte >= 97 /*a*/ && byte <= 122 /*z*/)
        return true
      if (byte >= 65 /*A*/ && byte <= 90 /*Z*/)
        return true
      if (byte >= 48 /*0*/ && byte <= 57 /*9*/)
        return true
      return false
    }

    while (cursor.remaining) {
      if (!isAlphanumeric(crypto.getRandomValues(byte)[0]))
        continue
      cursor.writeOrThrow(byte)
    }

    return Bytes.toUtf8(bytes)
  }, [maybePassword])

  useEffect(() => {
    if (maybePassword === password)
      return
    setPassword(password)
  }, [maybePassword, password, setPassword])

  const rawValue = useMemo(() => {
    return maybeValue?.trim().length
      ? maybeValue.trim()
      : "0"
  }, [maybeValue])

  const maybeFinalValue = useMemo(() => {
    try {
      return Fixed.fromStringOrZeroHex(rawValue, tokenData.decimals)
    } catch { }
  }, [rawValue, tokenData])

  const maybeTriedMaybeFinalData1 = useMemo(() => {
    if (maybeContract == null)
      return undefined
    if (maybeFinalValue == null)
      return undefined

    return Result.runAndDoubleWrapSync(() => {
      const abi = ERC20Abi.approve.fromOrThrow(maybeContract, maybeFinalValue.value)
      const hex = Abi.encodeOrThrow(abi)

      return hex
    })
  }, [maybeContract, maybeFinalValue])

  const onSendTransaction1Click = useCallback(() => {
    location.replace(hash.go(urlOf("/eth_sendTransaction", { trial: trial1Uuid, chain: chainData.chainId, target: tokenData.address, data: maybeTriedMaybeFinalData1?.getOrNull(), disableData: true, disableSign: true })))
  }, [hash, trial1Uuid, chainData, tokenData, maybeTriedMaybeFinalData1])

  const maybeTriedMaybeFinalData0 = useMemo(() => {
    if (maybeFinalValue == null)
      return undefined

    return Result.runAndDoubleWrapSync(() => {
      const token = tokenData.address
      const value = maybeFinalValue.value

      const passwordBytes = Bytes.fromUtf8(password)

      using hashSlice = Keccak256.get().getOrThrow().hashOrThrow(passwordBytes)
      using privateKey = Secp256k1.get().getOrThrow().SigningKey.importOrThrow(hashSlice)
      using publicKey = privateKey.getVerifyingKeyOrThrow()
      using publicKeyExport = publicKey.exportUncompressedOrThrow()

      const address = Address.computeOrThrow(publicKeyExport.bytes)

      const abi = PeanutAbi.makeDeposit.fromOrThrow(token, 1, value, 0, address)
      const hex = Abi.encodeOrThrow(abi)

      return hex
    })
  }, [maybeFinalValue, password, tokenData])

  const onSendTransaction0Click = useCallback(() => {
    location.replace(hash.go(urlOf("/eth_sendTransaction", { trial: trial0Uuid, chain: chainData.chainId, target: maybeContract, data: maybeTriedMaybeFinalData0?.getOrNull(), disableData: true, disableSign: true })))
  }, [hash, trial0Uuid, chainData, maybeContract, maybeTriedMaybeFinalData0])

  const trial1Query = useTransactionTrial(trial1Uuid)
  const maybeTrial1Data = trial1Query.current?.getOrNull()

  const transaction1Query = useTransactionWithReceipt(maybeTrial1Data?.transactions[0].uuid, context)
  const maybeTransaction1 = transaction1Query.current?.getOrNull()

  const trial0Query = useTransactionTrial(trial0Uuid)
  const maybeTrial0Data = trial0Query.current?.getOrNull()

  const transaction0Query = useTransactionWithReceipt(maybeTrial0Data?.transactions[0].uuid, context)
  const maybeTransaction0 = transaction0Query.current?.getOrNull()

  const maybeTriedLink = useMemo(() => {
    if (maybeTransaction0 == null)
      return
    if (maybeTransaction0.type !== "executed")
      return

    return Result.runAndDoubleWrapSync(() => {
      const signatureUtf8 = "DepositEvent(uint256,uint8,uint256,address)"
      const signatureBytes = Bytes.fromUtf8(signatureUtf8)

      using hashSlice = Keccak256.get().getOrThrow().hashOrThrow(signatureBytes)
      const hashHex = `0x${Base16.get().getOrThrow().encodeOrThrow(hashSlice)}`

      const log = maybeTransaction0.receipt.logs.find(log => log.topics[0] === hashHex)

      if (log == null)
        throw new Error(`Could not find log`)

      const index = BigInt(log.topics[1])

      return `https://peanut.to/claim?c=${chainData.chainId}&i=${index}&v=v4&t=ui#p=${password}`
    })
  }, [maybeTransaction0, password, chainData.chainId])

  const onLinkCopy = useCopy(maybeTriedLink?.ok().inner)

  const onClose = useCallback(() => {
    close()
  }, [close])

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === "/eth_sendTransaction" &&
        <Dialog>
          <WalletTransactionDialog />
        </Dialog>}
    </HashSubpathProvider>
    <Dialog.Title>
      Send {tokenData.symbol} on {chainData.name}
    </Dialog.Title>
    <div className="h-4" />
    <SimpleLabel>
      <div className="flex-none">
        Target
      </div>
      <div className="w-4" />
      <SimpleInput
        readOnly
        onFocus={onTargetFocus}
        value="Peanut" />
    </SimpleLabel>
    <div className="h-2" />
    {mode === "valued" &&
      <SimpleLabel>
        <div className="flex-none">
          Value
        </div>
        <div className="w-4" />
        <div className="grow flex flex-col overflow-hidden">
          <div className="flex items-center">
            <SimpleInput
              autoFocus
              value={rawValuedInput}
              onChange={onValuedInputChange}
              placeholder="0.0" />
            <div className="w-1" />
            <div className="text-contrast">
              {tokenData.symbol}
            </div>
          </div>
          <div className="flex items-center cursor-pointer"
            role="button"
            onClick={onPricedClick}>
            <div className="text-contrast truncate">
              {rawPricedInput || "0.0"}
            </div>
            <div className="grow" />
            <div className="text-contrast">
              USD
            </div>
          </div>
        </div>
        <div className="w-2" />
        <div className="flex items-center">
          {rawValuedInput.length === 0
            ? <RoundedShrinkableNakedButton
              onClick={onValuedPaste}>
              <Outline.ClipboardIcon className="size-4" />
            </RoundedShrinkableNakedButton>
            : <RoundedShrinkableNakedButton
              onClick={onValuedClear}>
              <Outline.XMarkIcon className="size-4" />
            </RoundedShrinkableNakedButton>}
          <div className="w-1" />
          <ShrinkableContrastButtonInInputBox
            disabled={valuedBalanceQuery.data == null}
            onClick={onValueMaxClick}>
            100%
          </ShrinkableContrastButtonInInputBox>
        </div>
      </SimpleLabel>}
    {mode === "priced" &&
      <SimpleLabel>
        <div className="flex-none">
          Value
        </div>
        <div className="w-4" />
        <div className="grow flex flex-col overflow-hidden">
          <div className="flex items-center">
            <SimpleInput
              autoFocus
              value={rawPricedInput}
              onChange={onPricedInputChange}
              placeholder="0.0" />
            <div className="w-1" />
            <div className="text-contrast">
              USD
            </div>
          </div>
          <div className="flex items-center cursor-pointer"
            role="button"
            onClick={onValuedClick}>
            <div className="text-contrast truncate">
              {rawValuedInput || "0.0"}
            </div>
            <div className="grow" />
            <div className="text-contrast">
              {tokenData.symbol}
            </div>
          </div>
        </div>
        <div className="w-2" />
        <div className="flex items-center">
          {rawPricedInput.length === 0
            ? <RoundedShrinkableNakedButton
              onClick={onPricedPaste}>
              <Outline.ClipboardIcon className="size-4" />
            </RoundedShrinkableNakedButton>
            : <RoundedShrinkableNakedButton
              onClick={onPricedClear}>
              <Outline.XMarkIcon className="size-4" />
            </RoundedShrinkableNakedButton>}
          <div className="w-1" />
          <ShrinkableContrastButtonInInputBox
            disabled={pricedBalanceQuery.data == null}
            onClick={onPricedMaxClick}>
            100%
          </ShrinkableContrastButtonInInputBox>
        </div>
      </SimpleLabel>}
    <div className="h-4" />
    {maybeTransaction1 != null && <>
      <div className="font-medium">
        Approval
      </div>
      <div className="h-2" />
      <TransactionCard
        data={maybeTransaction1}
        onSend={() => { }}
        onRetry={() => { }} />
      <div className="h-4" />
    </>}
    {maybeTransaction0 != null && <>
      <div className="font-medium">
        Deposit
      </div>
      <div className="h-2" />
      <TransactionCard
        data={maybeTransaction0}
        onSend={() => { }}
        onRetry={() => { }} />
      <div className="h-4" />
    </>}
    <div className="h-4 grow" />
    {maybeTriedLink?.isOk() && <>
      <div className="po-md flex items-center bg-contrast rounded-xl">
        <div className="flex flex-col truncate">
          <div className="flex items-center">
            <div className="font-medium">
              Link created
            </div>
          </div>
          <div className="text-contrast truncate">
            {maybeTriedLink.get()}
          </div>
          <div className="h-2" />
          <div className="flex items-center gap-1">
            <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
              onClick={onLinkCopy.run}>
              <AnchorShrinkerDiv>
                Copy
                {onLinkCopy.current
                  ? <Outline.CheckIcon className="size-4" />
                  : <Outline.ClipboardIcon className="size-4" />}
              </AnchorShrinkerDiv>
            </button>
            <a className="group px-2 bg-contrast rounded-full"
              target="_blank" rel="noreferrer"
              href={maybeTriedLink.get()}>
              <AnchorShrinkerDiv>
                Open
                <Outline.ArrowTopRightOnSquareIcon className="size-4" />
              </AnchorShrinkerDiv>
            </a>
          </div>
        </div>
      </div>
      <div className="h-2" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableOppositeButton
          onClick={onClose}>
          <Outline.CheckIcon className="size-5" />
          Close
        </WideShrinkableOppositeButton>
      </div>
    </>}
    {maybeTransaction1 == null &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableOppositeButton
          onClick={onSendTransaction1Click}>
          <Outline.PaperAirplaneIcon className="size-5" />
          Transact (1/2)
        </WideShrinkableOppositeButton>
      </div>}
    {maybeTransaction1?.type === "executed" && maybeTransaction0 == null &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableOppositeButton
          onClick={onSendTransaction0Click}>
          <Outline.PaperAirplaneIcon className="size-5" />
          Transact (2/2)
        </WideShrinkableOppositeButton>
      </div>}
  </>
}