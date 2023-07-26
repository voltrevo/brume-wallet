import { Errors } from "@/libs/errors/errors";
import { Signature } from "@/libs/ethereum/mods/signature";
import { Ledger } from "@/libs/ledger";
import { LedgerDevice } from "@/libs/ledger/mods/usb";
import { Results } from "@/libs/results/results";
import { Empty } from "@hazae41/binary";
import { Bytes } from "@hazae41/bytes";
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

  const getAddress = useCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!device)
        return Ok.void()

      const address = await Ledger.Ethereum
        .tryGetAddress(device, "44'/60'/0'/0/0")
        .then(r => r.throw(t))
      console.log(address)

      return Ok.void()
    }).then(Results.alert)
  }, [device])

  const signPersonalMessage = useCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!device)
        return Ok.void()

      const message = Bytes.tryRandom(150 - 25).throw(t)

      const signature = await Ledger.Ethereum
        .trySignPersonalMessage(device, "44'/60'/0'/0/0", message)
        .then(r => Signature.from(r.throw(t)))
      console.log(signature)

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
    <button onClick={getAddress}>
      getAddress
    </button>
    <button onClick={signPersonalMessage}>
      signPersonalMessage
    </button>
  </>
}