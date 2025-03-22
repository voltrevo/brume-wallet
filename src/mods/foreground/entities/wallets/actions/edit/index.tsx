import { Color } from "@/libs/colors/colors";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { WideClickableGradientButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastLabel } from "@/libs/ui/label";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { None, Some } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { useDeferredValue, useState } from "react";
import { RawWalletCard } from "../../card";
import { useWalletDataContext } from "../../context";
import { useWallet } from "../../data";
import { SimpleInput } from "../send";

export function WalletEditDialog(props: {}) {
  const close = useCloseContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()

  const query = useWallet(wallet.uuid)
  const color = Color.get(wallet.color)

  const [rawNameInput = "", setRawNameInput] = useState<string>(wallet.name)

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const saveOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await query.mutateOrThrow((s) => {
      const current = s.real?.current

      if (current == null)
        return new None()
      if (current.isErr())
        return new None()

      return new Some(current.mapSync(w => ({ ...w, name: defNameInput })))
    })

    close()
  }), [query, defNameInput])

  const NameInput =
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Name, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="My wallet"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </ContrastLabel>

  const SaveButton =
    <WideClickableGradientButton
      color={color}
      disabled={saveOrAlert.loading}
      onClick={saveOrAlert.run}>
      <Outline.CheckIcon className="size-5" />
      {Locale.get(Locale.Save, locale)}
    </WideClickableGradientButton>

  return <>
    <Dialog.Title>
      {Locale.get(Locale.Edit, locale)}
    </Dialog.Title>
    <div className="h-4" />
    <div className="grow flex flex-col items-center justify-center h-[200px]">
      <div className="w-full max-w-sm">
        <div className="w-full aspect-video rounded-xl">
          <RawWalletCard
            type={wallet.type}
            uuid={wallet.uuid}
            name={defNameInput}
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