import { Errors } from "@/libs/errors/errors";
import { Ledger } from "@/libs/ledger";
import { LedgerDevice } from "@/libs/ledger/mods/usb";
import { Empty } from "@hazae41/binary";
import { useCallback, useState } from "react";

export default function Page() {
  const [device, setDevice] = useState<LedgerDevice>()

  const connect = useCallback(async () => {
    try {
      setDevice(await Ledger.USB.tryConnect().then(r => r.unwrap()))
    } catch (e: unknown) {
      console.error(Errors.toJSON(e))
    }
  }, [])

  const test = useCallback(async () => {
    if (!device) return

    try {
      const request = { cla: 0xe0, ins: 0x06, p1: 0x00, p2: 0x00, fragment: new Empty() }
      const response = await device.tryRequest(request).then(r => r.unwrap())
      console.log(response)
    } catch (e: unknown) {
      console.error(Errors.toJSON(e))
    }
  }, [device])

  return <>
    <button onClick={connect}>
      connect
    </button>
    <button onClick={test}>
      test
    </button>
  </>
}