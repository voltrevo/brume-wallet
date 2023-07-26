import { Errors } from "@/libs/errors/errors";
import { Signature } from "@/libs/ethereum/mods/signature";
import { Ledger } from "@/libs/ledger";
import { LedgerDevice } from "@/libs/ledger/mods/usb";
import { Results } from "@/libs/results/results";
import { Empty, Opaque } from "@hazae41/binary";
import { Bytes } from "@hazae41/bytes";
import { Cursor } from "@hazae41/cursor";
import { Ok, Result } from "@hazae41/result";
import { verifyMessage } from "ethers";
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

  const getAppConfiguration = useCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!device)
        return Ok.void()

      const request = { cla: 0xe0, ins: 0x06, p1: 0x00, p2: 0x00, fragment: new Empty() }
      const response = await device.tryRequest(request).then(r => r.unwrap().unwrap().bytes)

      console.log({
        arbitraryDataEnabled: response[0] & 0x01,
        erc20ProvisioningNecessary: response[0] & 0x02,
        starkEnabled: response[0] & 0x04,
        starkv2Supported: response[0] & 0x08,
        version: "" + response[1] + "." + response[2] + "." + response[3],
      })

      return Ok.void()
    }).then(Results.alert)
  }, [device])

  const signPersonalMessage = useCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!device)
        return Ok.void()

      const path = "44'/60'/0'/0/0"
      const paths = new Array<number>()

      for (const comp of path.split("/")) {
        const value = comp.endsWith("'")
          ? parseInt(comp, 10) + 0x80000000
          : parseInt(comp, 10)
        paths.push(value)
      }

      const message = Bytes.tryRandom(1024).throw(t)
      const reader = new Cursor(message)

      let response: Bytes | undefined = undefined

      {
        const full = Math.min(150, reader.remaining)
        const head = 1 + (paths.length * 4) + 4

        const chunk = reader.tryRead(full - head).throw(t)

        const writer = Cursor.tryAllocUnsafe(full).throw(t)
        writer.tryWriteUint8(paths.length).throw(t)

        for (const path of paths)
          writer.tryWriteUint32(path).throw(t)

        writer.tryWriteUint32(message.length).throw(t)
        writer.tryWrite(chunk).throw(t)

        const request = { cla: 0xe0, ins: 0x08, p1: 0x00, p2: 0x00, fragment: new Opaque(writer.bytes) }
        response = await device.tryRequest(request).then(r => r.throw(t).throw(t).bytes)
      }

      while (reader.remaining) {
        const full = Math.min(150, reader.remaining)
        const chunk = reader.tryRead(full).throw(t)

        const request = { cla: 0xe0, ins: 0x08, p1: 0x80, p2: 0x00, fragment: new Opaque(chunk) }
        response = await device.tryRequest(request).then(r => r.throw(t).throw(t).bytes)
      }

      if (response == null)
        return Ok.void()

      const cursor = new Cursor(response)
      const v = cursor.tryReadUint8().throw(t)
      const r = cursor.tryRead(32).throw(t)
      const s = cursor.tryRead(32).throw(t)

      const signature = Signature.from({ v, r, s })
      console.log(signature);

      const address = verifyMessage(message, signature)
      console.log(address)

      return Ok.void()
    }).then(Results.alert)
  }, [device])

  return <>
    <button onClick={connect}>
      connect
    </button>
    <button onClick={getAppConfiguration}>
      getAppConfiguration
    </button>
    <button onClick={signPersonalMessage}>
      signPersonalMessage
    </button>
  </>
}