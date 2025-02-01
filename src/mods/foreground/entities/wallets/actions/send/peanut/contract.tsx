import { ERC20Abi } from "@/libs/abi/erc20.abi";
import { PeanutAbi } from "@/libs/abi/peanut.abi";
import { useCopy } from "@/libs/copy/copy";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { nto } from "@/libs/ntu";
import { Peanut } from "@/libs/peanut";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { ClickableContrastButtonInInputBox, RoundedClickableNakedButton, WideClickableOppositeButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastLabel } from "@/libs/ui/label";
import { GapperAndClickerInAnchorDiv } from "@/libs/ui/shrinker";
import { urlOf } from "@/libs/url/url";
import { randomUUID } from "@/libs/uuid/uuid";
import { useTransactionTrial, useTransactionWithReceipt } from "@/mods/foreground/entities/transactions/data";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { useContractTokenBalance, useContractTokenPricedBalance } from "@/mods/universal/ethereum/mods/tokens/mods/balance/hooks";
import { useContractToken } from "@/mods/universal/ethereum/mods/tokens/mods/core/hooks";
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
import { SimpleInput } from "..";
import { useWalletDataContext } from "../../../context";
import { useEthereumContext } from "../../../data";
import { TransactionCard, WalletTransactionDialog } from "../../eth_sendTransaction";

export function WalletPeanutSendScreenContractValue(props: {}) {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
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

  const maybeTokenAddress = useMemo(() => {
    if (maybeToken == null)
      return
    return Address.fromOrNull(maybeToken)
  }, [maybeToken])

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

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const tokenQuery = useContractToken(context, maybeTokenAddress, "latest")
  const maybeTokenData = Option.wrap(tokenQuery.current?.getOrNull())
  const tokenData = maybeTokenData.getOrThrow()

  const priceQuery = useContractTokenPriceV3(context, tokenData.address, "latest")
  const maybePrice = priceQuery.current?.mapSync(x => Fixed.from(x)).getOrNull()

  const [rawValuedInput = "", setRawValuedInput] = useState(nto(maybeValue))
  const [rawPricedInput = "", setRawPricedInput] = useState<Optional<string>>()

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

  const defValuedInput = useDeferredValue(rawValuedInput)

  useEffect(() => {
    setValue(defValuedInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defValuedInput])

  const [mode, setMode] = useState<"valued" | "priced">("valued")

  const valuedBalanceQuery = useContractTokenBalance(context, tokenData.address, wallet.address as Address, "latest")
  const pricedBalanceQuery = useContractTokenPricedBalance(context, tokenData.address, wallet.address as Address, "latest")

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
      {Locale.get({
        en: `Send ${tokenData.symbol} on ${chainData.name}`,
        zh: `在 ${chainData.name} 上发送 ${tokenData.symbol}`,
        hi: `${chainData.name} पर ${tokenData.symbol} भेजें`,
        es: `Enviar ${tokenData.symbol} en ${chainData.name}`,
        ar: `إرسال ${tokenData.symbol} على ${chainData.name}`,
        fr: `Envoyer ${tokenData.symbol} sur ${chainData.name}`,
        de: `Senden ${tokenData.symbol} auf ${chainData.name}`,
        ru: `Отправить ${tokenData.symbol} на ${chainData.name}`,
        pt: `Enviar ${tokenData.symbol} em ${chainData.name}`,
        ja: `${chainData.name} で ${tokenData.symbol} を送信する`,
        pa: `${chainData.name} 'ਤੇ ${tokenData.symbol} ਭੇਜੋ`,
        bn: `${chainData.name} তে ${tokenData.symbol} পাঠান`,
        id: `Kirim ${tokenData.symbol} di ${chainData.name}`,
        ur: `${chainData.name} پر ${tokenData.symbol} بھیجیں`,
        ms: `Hantar ${tokenData.symbol} di ${chainData.name}`,
        it: `Invia ${tokenData.symbol} su ${chainData.name}`,
        tr: `${chainData.name} üzerinde ${tokenData.symbol} gönder`,
        ta: `${chainData.name} உள்ளிட்டு ${tokenData.symbol} அனுப்பவும்`,
        te: `${chainData.name} లో ${tokenData.symbol} పంపండి`,
        ko: `${chainData.name} 에서 ${tokenData.symbol} 보내기`,
        vi: `Gửi ${tokenData.symbol} trên ${chainData.name}`,
        pl: `Wyślij ${tokenData.symbol} na ${chainData.name}`,
        ro: `Trimite ${tokenData.symbol} pe ${chainData.name}`,
        nl: `Verzend ${tokenData.symbol} op ${chainData.name}`,
        el: `Στείλτε ${tokenData.symbol} στο ${chainData.name}`,
        th: `ส่ง ${tokenData.symbol} ใน ${chainData.name}`,
        cs: `Poslat ${tokenData.symbol} na ${chainData.name}`,
        hu: `Küldj ${tokenData.symbol} a ${chainData.name} -on`,
        sv: `Skicka ${tokenData.symbol} på ${chainData.name}`,
        da: `Send ${tokenData.symbol} på ${chainData.name}`,
      }, locale)}
    </Dialog.Title>
    <div className="h-4" />
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Recipient, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        readOnly
        onFocus={onTargetFocus}
        value="Peanut" />
    </ContrastLabel>
    <div className="h-2" />
    {mode === "valued" &&
      <ContrastLabel>
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
            <div className="text-default-contrast">
              {tokenData.symbol}
            </div>
          </div>
          <div className="flex items-center cursor-pointer"
            role="button"
            onClick={onPricedClick}>
            <div className="text-default-contrast truncate">
              {rawPricedInput || "0.0"}
            </div>
            <div className="grow" />
            <div className="text-default-contrast">
              USD
            </div>
          </div>
        </div>
        <div className="w-2" />
        <div className="flex items-center">
          {rawValuedInput.length === 0
            ? <RoundedClickableNakedButton
              onClick={onValuedPaste}>
              <Outline.ClipboardIcon className="size-4" />
            </RoundedClickableNakedButton>
            : <RoundedClickableNakedButton
              onClick={onValuedClear}>
              <Outline.XMarkIcon className="size-4" />
            </RoundedClickableNakedButton>}
          <div className="w-1" />
          <ClickableContrastButtonInInputBox
            disabled={valuedBalanceQuery.data == null}
            onClick={onValueMaxClick}>
            100%
          </ClickableContrastButtonInInputBox>
        </div>
      </ContrastLabel>}
    {mode === "priced" &&
      <ContrastLabel>
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
            <div className="text-default-contrast">
              USD
            </div>
          </div>
          <div className="flex items-center cursor-pointer"
            role="button"
            onClick={onValuedClick}>
            <div className="text-default-contrast truncate">
              {rawValuedInput || "0.0"}
            </div>
            <div className="grow" />
            <div className="text-default-contrast">
              {tokenData.symbol}
            </div>
          </div>
        </div>
        <div className="w-2" />
        <div className="flex items-center">
          {rawPricedInput.length === 0
            ? <RoundedClickableNakedButton
              onClick={onPricedPaste}>
              <Outline.ClipboardIcon className="size-4" />
            </RoundedClickableNakedButton>
            : <RoundedClickableNakedButton
              onClick={onPricedClear}>
              <Outline.XMarkIcon className="size-4" />
            </RoundedClickableNakedButton>}
          <div className="w-1" />
          <ClickableContrastButtonInInputBox
            disabled={pricedBalanceQuery.data == null}
            onClick={onPricedMaxClick}>
            100%
          </ClickableContrastButtonInInputBox>
        </div>
      </ContrastLabel>}
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
      <div className="po-2 flex items-center bg-default-contrast rounded-xl">
        <div className="flex flex-col truncate">
          <div className="flex items-center">
            <div className="font-medium">
              Link created
            </div>
          </div>
          <div className="text-default-contrast truncate">
            {maybeTriedLink.get()}
          </div>
          <div className="h-2" />
          <div className="flex items-center gap-1">
            <button className="group px-2 bg-default-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
              onClick={onLinkCopy.run}>
              <GapperAndClickerInAnchorDiv>
                Copy
                {onLinkCopy.current
                  ? <Outline.CheckIcon className="size-4" />
                  : <Outline.ClipboardIcon className="size-4" />}
              </GapperAndClickerInAnchorDiv>
            </button>
            <a className="group px-2 bg-default-contrast rounded-full"
              target="_blank" rel="noreferrer"
              href={maybeTriedLink.get()}>
              <GapperAndClickerInAnchorDiv>
                Open
                <Outline.ArrowTopRightOnSquareIcon className="size-4" />
              </GapperAndClickerInAnchorDiv>
            </a>
          </div>
        </div>
      </div>
      <div className="h-2" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableOppositeButton
          onClick={onClose}>
          <Outline.CheckIcon className="size-5" />
          Close
        </WideClickableOppositeButton>
      </div>
    </>}
    {maybeTransaction1 == null &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableOppositeButton
          onClick={onSendTransaction1Click}>
          <Outline.PaperAirplaneIcon className="size-5" />
          Transact (1/2)
        </WideClickableOppositeButton>
      </div>}
    {maybeTransaction1?.type === "executed" && maybeTransaction0 == null &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableOppositeButton
          onClick={onSendTransaction0Click}>
          <Outline.PaperAirplaneIcon className="size-5" />
          Transact (2/2)
        </WideClickableOppositeButton>
      </div>}
  </>
}