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
      const response = await device.tryRequest(request).then(r => r.unwrap().unwrap().bytes)

      console.log({
        arbitraryDataEnabled: response[0] & 0x01,
        erc20ProvisioningNecessary: response[0] & 0x02,
        starkEnabled: response[0] & 0x04,
        starkv2Supported: response[0] & 0x08,
        version: "" + response[1] + "." + response[2] + "." + response[3],
      })
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