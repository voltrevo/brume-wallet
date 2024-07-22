import { Color } from "@/libs/colors/colors";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { useCloseContext } from "@hazae41/chemin";
import { None, Some } from "@hazae41/option";
import { useDeferredValue, useMemo, useState } from "react";
import { RawWalletCard } from "../../card";
import { useWalletDataContext } from "../../context";
import { useWallet } from "../../data";
import { SimpleInput, SimpleLabel, WideShrinkableGradientButton } from "../send";

export function WalletEditDialog(props: {}) {
  const wallet = useWalletDataContext().unwrap()
  const close = useCloseContext().unwrap()

  const query = useWallet(wallet.uuid)
  const color = Color.get(wallet.color)

  const [rawNameInput = "", setRawNameInput] = useState<string>(wallet.name)

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const finalNameInput = useMemo(() => {
    return defNameInput || "Holder"
  }, [defNameInput])

  const saveOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    await query.mutate((s) => {
      const current = s.real?.current

      if (current == null)
        return new None()
      if (current.isErr())
        return new None()

      return new Some(current.mapSync(w => ({ ...w, name: finalNameInput })))
    })

    close()
  }), [query, finalNameInput])

  const NameInput =
    <SimpleLabel>
      <div className="shrink-0">
        Name
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="Holder"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </SimpleLabel>

  const SaveButton =
    <WideShrinkableGradientButton
      color={color}
      disabled={saveOrAlert.loading}
      onClick={saveOrAlert.run}>
      <Outline.CheckIcon className="size-5" />
      Save
    </WideShrinkableGradientButton>

  return <>
    <Dialog.Title>
      Edit
    </Dialog.Title>
    <div className="h-4" />
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="w-full aspect-video rounded-xl">
          <RawWalletCard
            uuid={wallet.uuid}
            name={finalNameInput}
            emoji={wallet.emoji}
            address={wallet.address}
            color={color} />
        </div>
      </div>
    </div>
    <div className="h-2" />
    <div className="flex-1 flex flex-col">
      <div className="grow" />
      {NameInput}
      <div className="h-4" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        {SaveButton}
      </div>
    </div>
  </>
}