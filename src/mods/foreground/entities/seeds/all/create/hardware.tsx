/* eslint-disable @next/next/no-img-element */
import { Color } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog, Dialog2 } from "@/libs/ui/dialog/dialog";
import { randomUUID } from "@/libs/uuid/uuid";
import { SeedData } from "@/mods/background/service_worker/entities/seeds/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { HashSubpathProvider, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { Ledger } from "@hazae41/ledger";
import { useCloseContext } from "@hazae41/react-close-context";
import { Err, Panic } from "@hazae41/result";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useGenius } from "../../../users/all/page";
import { SimpleInput, SimpleLabel, WideShrinkableGradientButton } from "../../../wallets/actions/send";
import { RawSeedCard } from "../../card";

export function LedgerSeedCreatorDialog(props: {}) {
  const path = usePathContext().unwrap()
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const subpath = useHashSubpath(path)
  const connect = useGenius(subpath, "/connect")

  const uuid = useConstant(() => randomUUID())

  const modhash = useModhash(uuid)
  const color = Color.get(modhash)
  const emoji = Emojis.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const finalNameInput = useMemo(() => {
    return defNameInput || "Holder"
  }, [defNameInput])

  const addOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (!finalNameInput)
      return new Err(new Panic())

    const device = await Ledger.USB.getOrRequestDeviceOrThrow()
    const connector = await Ledger.USB.connectOrThrow(device)

    const { address } = await Ledger.Ethereum.tryGetAddress(connector, "44'/60'/0'/0/0").then(r => r.unwrap())

    const seed: SeedData = { type: "ledger", uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, address }

    await background.requestOrThrow<void>({
      method: "brume_createSeed",
      params: [seed]
    }).then(r => r.unwrap())

    close()
  }), [finalNameInput, uuid, color, emoji, background, close])

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

  const canAdd = useMemo(() => {
    if (!finalNameInput)
      return false
    return true
  }, [finalNameInput])

  const AddButton =
    <WideShrinkableGradientButton
      color={color}
      disabled={!canAdd}
      onClick={addOrAlert.run}>
      <Outline.PlusIcon className="size-5" />
      Add
    </WideShrinkableGradientButton>

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === "/connect" &&
        <Dialog2>
          <HardwareSelectDialog />
        </Dialog2>}
    </HashSubpathProvider>
    <Dialog.Title>
      New seed
    </Dialog.Title>
    <div className="h-4" />
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="w-full aspect-video rounded-xl">
          <RawSeedCard
            name={finalNameInput}
            emoji={emoji}
            color={color} />
        </div>
      </div>
    </div>
    <div className="h-2" />
    <div className="flex-1 flex flex-col">
      <div className="grow" />
      {NameInput}
      {/* <div className="h-2" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableContrastAnchor
          onKeyDown={connect.onKeyDown}
          onClick={connect.onClick}
          href={connect.href}>
          <Outline.SwatchIcon className="size-5" />
          Choose a device
        </WideShrinkableContrastAnchor>
      </div> */}
      <div className="h-4" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        {AddButton}
      </div>
    </div>
  </>
}

export function HardwareSelectDialog() {
  const [devices, setDevices] = useState<USBDevice[]>([])

  const getDevices = useCallback(() => {
    navigator.usb.getDevices().then(setDevices)
  }, [])

  useEffect(() => {
    const i = setInterval(getDevices, 1000)

    getDevices()

    return () => clearInterval(i)
  }, [getDevices])

  return <>
    <Dialog.Title>
      Connect a hardware wallet
    </Dialog.Title>
    <div className="h-4" />
    <div className="flex flex-col gap-2">
      {devices.map(device =>
        <div className="po-md bg-contrast rounded-xl flex items-center"
          key={device.serialNumber}>
          <img className="h-16 w-auto"
            src="/assets/devices/ledger_nano_s.png"
            alt="Ledger Nano S" />
          <div className="w-4" />
          <div className="">
            <div className="">
              {device.productName}
            </div>
            <div className="text-contrast">
              {device.manufacturerName}, {device.deviceVersionMajor}.{device.deviceVersionMinor}.{device.deviceVersionSubminor}
            </div>
          </div>
        </div>)}
      <div className="po-md rounded-xl border border-contrast border-dashed flex items-center justify-center gap-2 h-[80px]">
        <Outline.PlusIcon className="size-5" />
        New device
      </div>
    </div>
  </>
}