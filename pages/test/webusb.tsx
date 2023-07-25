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

  const signPersonalMessage = useCallback(async () => {
    if (!device) return

    return await Result.unthrow<Result<void, Error>>(async t => {
      const path = "44'/60'/0'/0/0"
      const paths = new Array<number>()

      for (const comp of path.split("/")) {
        const value = comp.endsWith("'")
          ? parseInt(comp, 10) + 0x80000000
          : parseInt(comp, 10)
        paths.push(value)
      }

      const message = Buffer.from("hello world", "utf8")

      let response: Bytes | undefined = undefined

      for (let offset = 0; offset !== message.length;) {
        console.log("not done")
        const maxChunkSize = offset === 0
          ? 150 - 1 - paths.length * 4 - 4
          : 150;

        const chunkSize = offset + maxChunkSize > message.length
          ? message.length - offset
          : maxChunkSize;

        const buffer = Buffer.alloc(offset === 0
          ? 1 + paths.length * 4 + 4 + chunkSize
          : chunkSize)

        if (offset === 0) {
          buffer[0] = paths.length;
          paths.forEach((element, index) => {
            buffer.writeUInt32BE(element, 1 + 4 * index);
          });
          buffer.writeUInt32BE(message.length, 1 + 4 * paths.length);
          message.copy(buffer, 1 + 4 * paths.length + 4, offset, offset + chunkSize);
        } else {
          message.copy(buffer, 0, offset, offset + chunkSize);
        }

        const request = { cla: 0xe0, ins: 0x08, p1: offset === 0 ? 0x00 : 0x80, p2: 0x00, fragment: new Opaque(buffer) }
        response = await device.tryRequest(request).then(r => r.throw(t).throw(t).bytes)

        offset += chunkSize;
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