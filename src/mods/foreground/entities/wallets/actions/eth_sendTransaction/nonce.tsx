import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useEffectButNotFirstTime } from "@/libs/react/effect";
import { useInputChange, useKeyboardEnter } from "@/libs/react/events";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { usePathState, useSearchState } from "@/mods/foreground/router/path/context";
import { Option, Optional } from "@hazae41/option";
import { SyntheticEvent, useCallback, useDeferredValue, useState } from "react";
import { UrlState } from ".";
import { useNonce } from "../../../unknown/data";
import { useWalletDataContext } from "../../context";
import { useEthereumContext } from "../../data";
import { ShrinkableContrastButtonInInputBox, ShrinkableNakedButtonInInputBox, SimpleBox, SimpleInput } from "../send";

export function WalletTransactionScreenNonce(props: {}) {
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()

  const $state = usePathState<UrlState>()
  const [maybeStep, setStep] = useSearchState("step", $state)
  const [maybeChain, setChain] = useSearchState("chain", $state)
  const [maybeNonce, setNonce] = useSearchState("nonce", $state)

  const chain = Option.unwrap(maybeChain)
  const chainData = chainByChainId[Number(chain)]
  const tokenData = chainData.token

  const context = useEthereumContext(wallet.uuid, chainData)

  const pendingNonceQuery = useNonce(wallet.address, context)
  const maybePendingNonce = pendingNonceQuery.current?.ok().get()

  const [rawNonceInput = "", setRawNonceInput] = useState<Optional<string>>(maybeNonce)

  const onInputChange = useInputChange(e => {
    setRawNonceInput(e.target.value)
  }, [])

  const nonceInput = useDeferredValue(rawNonceInput)

  useEffectButNotFirstTime(() => {
    setNonce(nonceInput)
  }, [nonceInput])

  const onSubmit = useCallback(async () => {
    setStep("value")
  }, [setStep])

  const onEnter = useKeyboardEnter(() => {
    onSubmit()
  }, [onSubmit])

  const onClear = useCallback((e: SyntheticEvent) => {
    setRawNonceInput("")
  }, [])

  const onPaste = useCallback(async () => {
    setNonce(await navigator.clipboard.readText())
    setStep("value")
  }, [setNonce, setStep])

  return <>
    <Dialog.Title close={close}>
      Send {tokenData.symbol} on {chainData.name}
    </Dialog.Title>
    <div className="h-4" />
    <SimpleBox>
      <div className="">
        Nonce
      </div>
      <div className="w-4" />
      <SimpleInput
        autoFocus
        value={rawNonceInput}
        onChange={onInputChange}
        onKeyDown={onEnter}
        placeholder={maybePendingNonce?.toString()} />
      <div className="w-1" />
      <div className="flex items-center">
        {rawNonceInput.length === 0
          ? <ShrinkableNakedButtonInInputBox
            onClick={onPaste}>
            <Outline.ClipboardIcon className="size-4" />
          </ShrinkableNakedButtonInInputBox>
          : <ShrinkableNakedButtonInInputBox
            onClick={onClear}>
            <Outline.XMarkIcon className="size-4" />
          </ShrinkableNakedButtonInInputBox>}
        <div className="w-1" />
        <ShrinkableContrastButtonInInputBox
          onClick={onSubmit}>
          OK
        </ShrinkableContrastButtonInInputBox>
      </div>
    </SimpleBox>
    <div className="h-4" />
    <div className="text-lg font-medium">
      Pending transactions
    </div>
    <div className="grow flex flex-col items-center justify-center">
      Coming soon...
    </div>
  </>
}