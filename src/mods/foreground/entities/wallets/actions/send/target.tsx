/* eslint-disable @next/next/no-img-element */
import { chainDataByChainId, tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useEffectButNotFirstTime } from "@/libs/react/effect";
import { useInputChange, useKeyboardEnter } from "@/libs/react/events";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { useKeyValueState } from "@/mods/foreground/router/path/context";
import { usePathContext, useSearchAsKeyValueState } from "@hazae41/chemin";
import { Address } from "@hazae41/cubane";
import { Option, Optional } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { SyntheticEvent, useCallback, useDeferredValue, useState } from "react";
import { RoundedShrinkableNakedButton, ShrinkableContrastButtonInInputBox, SimpleInput, SimpleLabel, UrlState, WideShrinkableContrastButton } from ".";
import { useEnsLookup } from "../../../names/data";
import { useToken } from "../../../tokens/data";
import { useWalletDataContext } from "../../context";
import { useEthereumContext } from "../../data";

export function WalletSendScreenTarget(props: {}) {
  const path = usePathContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()

  const $state = useSearchAsKeyValueState<UrlState>(path)
  const [maybeStep, setStep] = useKeyValueState("step", $state)
  const [maybeChain, setChain] = useKeyValueState("chain", $state)
  const [maybeTarget, setTarget] = useKeyValueState("target", $state)
  const [maybeType, setType] = useKeyValueState("type", $state)
  const [maybeToken, setToken] = useKeyValueState("token", $state)

  const chain = Option.unwrap(maybeChain)
  const chainData = chainDataByChainId[Number(chain)]

  const tokenQuery = useToken(chainData.chainId, maybeToken)
  const maybeTokenData = Option.wrap(tokenQuery.current?.ok().get())
  const maybeTokenDef = Option.wrap(tokenByAddress[maybeToken as any])
  const tokenData = maybeTokenData.or(maybeTokenDef).unwrapOr(chainData.token)

  const mainnet = useEthereumContext(wallet.uuid, chainDataByChainId[1])

  const [rawTargetInput = "", setRawTargetInput] = useState<Optional<string>>(maybeTarget)

  const onTargetInputChange = useInputChange(e => {
    setRawTargetInput(e.target.value)
  }, [])

  const targetInput = useDeferredValue(rawTargetInput)

  useEffectButNotFirstTime(() => {
    setType(undefined)
    setTarget(targetInput)
  }, [targetInput])

  const maybeEnsInput = maybeTarget?.endsWith(".eth")
    ? targetInput
    : undefined

  const ensQuery = useEnsLookup(maybeEnsInput, mainnet)
  const maybeEns = ensQuery.current?.ok().get()

  const onSubmit = useCallback(async () => {
    if (maybeTarget == null)
      return
    if (Address.fromOrNull(maybeTarget) == null && !maybeTarget.endsWith(".eth"))
      return
    setStep("value")
  }, [maybeTarget, setStep])

  const onEnter = useKeyboardEnter(() => {
    onSubmit()
  }, [onSubmit])

  const onClear = useCallback((e: SyntheticEvent) => {
    setRawTargetInput("")
  }, [])

  const onPaste = useCallback(async () => {
    const input = await navigator.clipboard.readText()

    if (Address.fromOrNull(input) == null && !input.endsWith(".eth"))
      return

    setType(undefined)
    setTarget(input)
    setStep("value")
  }, [setType, setStep, setTarget])

  const [mode, setMode] = useState<"recents" | "contacts">("recents")

  const onRecentsClick = useCallback(() => {
    setMode("recents")
  }, [])

  const onContactsClick = useCallback(() => {
    setMode("contacts")
  }, [])

  const onPeanutClick = useCallback(() => {
    setType("peanut")
    setTarget(undefined)
    setStep("value")
  }, [setType, setStep, setTarget])

  const onBrumeClick = useCallback(() => {
    setType(undefined)
    setTarget("brume.eth")
    setStep("value")
  }, [setType, setStep, setTarget])

  return <>
    <Dialog.Title>
      Send {tokenData.symbol} on {chainData.name}
    </Dialog.Title>
    <div className="h-4" />
    <SimpleLabel>
      <div className="shrink-0">
        Target
      </div>
      <div className="w-4" />
      <SimpleInput
        autoFocus
        value={rawTargetInput}
        onChange={onTargetInputChange}
        onKeyDown={onEnter}
        placeholder="brume.eth" />
      <div className="w-1" />
      <div className="flex items-center">
        {rawTargetInput.length === 0
          ? <RoundedShrinkableNakedButton
            onClick={onPaste}>
            <Outline.ClipboardIcon className="size-4" />
          </RoundedShrinkableNakedButton>
          : <RoundedShrinkableNakedButton
            onClick={onClear}>
            <Outline.XMarkIcon className="size-4" />
          </RoundedShrinkableNakedButton>}
        <div className="w-1" />
        <ShrinkableContrastButtonInInputBox
          onClick={onSubmit}>
          OK
        </ShrinkableContrastButtonInInputBox>
      </div>
    </SimpleLabel>
    <div className="h-2" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      <WideShrinkableContrastButton
        onClick={onPeanutClick}>
        <Outline.LinkIcon className="size-4" />
        Create Peanut link (beta)
      </WideShrinkableContrastButton>
    </div>
    {maybeEns != null && <>
      <div className="h-2" />
      <div className="po-md flex items-center bg-contrast rounded-xl cursor-pointer"
        role="button"
        onClick={onSubmit}>
        <div className="size-12 shrink-0 rounded-full bg-contrast" />
        <div className="w-4" />
        <div className="flex flex-col truncate">
          <div className="font-medium">
            {targetInput}
          </div>
          <div className="text-contrast truncate">
            {maybeEns}
          </div>
        </div>
      </div>
    </>}
    <div className="h-4" />
    <div className="flex items-center">
      <button className="text-lg font-medium text-contrast data-[active=true]:text-default"
        onClick={onRecentsClick}
        data-active={mode === "recents"}>
        Recents
      </button>
      <div className="grow" />
      <button className="text-contrast font-medium text-contrast data-[active=true]:text-default"
        onClick={onContactsClick}
        data-active={mode === "contacts"}>
        Contacts
      </button>
    </div>
    <div className="h-2" />
    <div className="po-md flex items-center bg-contrast rounded-xl cursor-pointer"
      role="button"
      onClick={onBrumeClick}>
      <img className="size-12 shrink-0 rounded-full bg-contrast"
        src="/square.png"
        alt="logo" />
      <div className="w-4" />
      <div className="flex flex-col truncate">
        <div className="font-medium">
          Brume Wallet
        </div>
        <div className="text-contrast truncate">
          brume.eth
        </div>
      </div>
    </div>
    <div className="grow flex flex-col items-center justify-center">
      Coming soon...
    </div>
  </>
}