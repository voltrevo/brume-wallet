import { ERC20Abi } from "@/libs/abi/erc20.abi";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons";
import { nto } from "@/libs/ntu";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { ClickableContrastButtonInInputBox, RoundedClickableNakedButton, WideClickableOppositeButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastLabel } from "@/libs/ui/label";
import { urlOf } from "@/libs/url/url";
import { randomUUID } from "@/libs/uuid/uuid";
import { useTransactionTrial, useTransactionWithReceipt } from "@/mods/foreground/entities/transactions/data";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { useContractTokenBalance, useContractTokenPricedBalance } from "@/mods/universal/ethereum/mods/tokens/mods/balance/hooks";
import { useContractToken } from "@/mods/universal/ethereum/mods/tokens/mods/core/hooks";
import { useContractTokenPriceV3 } from "@/mods/universal/ethereum/mods/tokens/mods/price/hooks";
import { HashSubpathProvider, useHashSubpath, usePathContext, useSearchState } from "@hazae41/chemin";
import { Abi, Address, Fixed } from "@hazae41/cubane";
import { Option, Optional } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { Result } from "@hazae41/result";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { SimpleInput } from "..";
import { useEnsLookup } from "../../../../names/data";
import { useWalletDataContext } from "../../../context";
import { useEthereumContext } from "../../../data";
import { TransactionCard, WalletTransactionDialog } from "../../eth_sendTransaction";

export function WalletDirectSendScreenContractValue(props: {}) {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const close = useCloseContext().getOrThrow()

  const hash = useHashSubpath(path)

  const [maybeStep, setStep] = useSearchState(path, "step")
  const [maybeChain, setChain] = useSearchState(path, "chain")
  const [maybeToken, setToken] = useSearchState(path, "token")
  const [maybeTarget, setTarget] = useSearchState(path, "target")
  const [maybeValue, setValue] = useSearchState(path, "value")
  const [maybeTrial0, setTrial0] = useSearchState(path, "trial0")

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

  const mainnet = useEthereumContext(wallet.uuid, chainDataByChainId[1]).getOrThrow()

  const maybeEnsQueryKey = maybeTarget?.endsWith(".eth")
    ? maybeTarget
    : undefined

  const ensTargetQuery = useEnsLookup(maybeEnsQueryKey, mainnet)
  const maybeEnsTarget = ensTargetQuery.current?.getOrNull()

  const maybeFinalTarget = useMemo(() => {
    if (maybeTarget == null)
      return undefined
    if (Address.fromOrNull(maybeTarget) != null)
      return maybeTarget
    if (maybeEnsTarget != null)
      return maybeEnsTarget
    return undefined
  }, [maybeTarget, maybeEnsTarget])

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

  const maybeTriedMaybeFinalData = useMemo(() => {
    if (maybeFinalTarget == null)
      return undefined
    if (maybeFinalValue == null)
      return undefined

    return Result.runAndDoubleWrapSync(() => {
      const address = Address.fromOrThrow(maybeFinalTarget)
      const value = maybeFinalValue.value

      const abi = ERC20Abi.transfer.fromOrThrow(address, value)
      const hex = Abi.encodeOrThrow(abi)

      return hex
    })
  }, [maybeFinalTarget, maybeFinalValue])

  const onSendTransactionClick = useCallback(() => {
    location.replace(hash.go(urlOf("/eth_sendTransaction", { trial: trial0Uuid, chain: chainData.chainId, target: tokenData.address, data: maybeTriedMaybeFinalData?.getOrNull(), disableData: true })))
  }, [hash, trial0Uuid, chainData, tokenData, maybeTriedMaybeFinalData])

  const trialQuery = useTransactionTrial(trial0Uuid)
  const maybeTrialData = trialQuery.current?.getOrNull()

  const transactionQuery = useTransactionWithReceipt(maybeTrialData?.transactions[0].uuid, context)
  const maybeTransaction = transactionQuery.current?.getOrNull()

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
        onFocus={onTargetFocus}
        value={nto(maybeTarget)}
        readOnly />
    </ContrastLabel>
    <div className="h-2" />
    {mode === "valued" &&
      <ContrastLabel>
        <div className="flex-none">
          {Locale.get(Locale.Amount, locale)}
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
          {Locale.get(Locale.Amount, locale)}
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
    {maybeTransaction != null && <>
      <div className="font-medium">
        Transfer
      </div>
      <div className="h-2" />
      <TransactionCard
        data={maybeTransaction}
        onSend={() => { }}
        onRetry={() => { }} />
      <div className="h-4" />
    </>}
    <div className="h-4 grow" />
    {maybeTransaction == null &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableOppositeButton
          onClick={onSendTransactionClick}>
          <Outline.PaperAirplaneIcon className="size-5" />
          {Locale.get(Locale.Send, locale)}
        </WideClickableOppositeButton>
      </div>}
    {maybeTransaction != null &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableOppositeButton
          onClick={onClose}>
          <Outline.CheckIcon className="size-5" />
          {Locale.get(Locale.Close, locale)}
        </WideClickableOppositeButton>
      </div>}
  </>
}