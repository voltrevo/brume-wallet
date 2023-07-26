import { SignatureInit } from "@/libs/ethereum/mods/signature";
import { Empty, Opaque, Writable } from "@hazae41/binary";
import { Bytes } from "@hazae41/bytes";
import { Cursor } from "@hazae41/cursor";
import { Ok, Result } from "@hazae41/result";
import { Paths } from "../binary/paths";
import { LedgerDevice } from "../usb";

export interface AppConfigResult {
  readonly arbitraryDataEnabled: boolean,
  readonly erc20ProvisioningNecessary: boolean,
  readonly starkEnabled: boolean,
  readonly starkv2Supported: boolean,

  readonly version: string
}

export async function tryGetAppConfig(device: LedgerDevice): Promise<Result<AppConfigResult, Error>> {
  return await Result.unthrow(async t => {
    const request = { cla: 0xe0, ins: 0x06, p1: 0x00, p2: 0x00, fragment: new Empty() }
    const response = await device.tryRequest(request).then(r => r.throw(t).throw(t).bytes)

    const arbitraryDataEnabled = Boolean(response[0] & 0x01)
    const erc20ProvisioningNecessary = Boolean(response[0] & 0x02)
    const starkEnabled = Boolean(response[0] & 0x04)
    const starkv2Supported = Boolean(response[0] & 0x08)

    const version = `${response[1]}.${response[2]}.${response[3]}`

    return new Ok({ arbitraryDataEnabled, erc20ProvisioningNecessary, starkEnabled, starkv2Supported, version })
  })
}

export interface GetAddressResult {
  /**
   * 0x-prefixed hex address
   */
  readonly address: string

  /**
   * Raw uncompressed public key bytes
   */
  readonly uncompressedPublicKey: Bytes

  readonly chaincode: Bytes<32>
}

/**
 * Just get the address
 * @param device 
 * @param path 
 * @returns 
 */
export async function tryGetAddress(device: LedgerDevice, path: string): Promise<Result<GetAddressResult, Error>> {
  return await Result.unthrow(async t => {
    const paths = Paths.from(path)

    const bytes = Writable.tryWriteToBytes(paths).throw(t)

    const request = { cla: 0xe0, ins: 0x02, p1: 0x00, p2: 0x01, fragment: new Opaque(bytes) }
    const response = await device.tryRequest(request).then(r => r.throw(t).throw(t).bytes)

    const cursor = new Cursor(response)

    const uncompressedPublicKeyLength = cursor.tryReadUint8().throw(t)
    const uncompressedPublicKey = cursor.tryRead(uncompressedPublicKeyLength).throw(t)

    const addressLength = cursor.tryReadUint8().throw(t)
    const address = `0x${Bytes.toAscii(cursor.tryRead(addressLength).throw(t))}`

    const chaincode = cursor.tryRead(32).throw(t)

    return new Ok({ uncompressedPublicKey, address, chaincode })
  })
}

/**
 * Ask the user to verify the address and get it
 * @param device 
 * @param path 
 * @returns 
 */
export async function tryVerifyAndGetAddress(device: LedgerDevice, path: string): Promise<Result<GetAddressResult, Error>> {
  return await Result.unthrow(async t => {
    const paths = Paths.from(path)

    const bytes = Writable.tryWriteToBytes(paths).throw(t)

    const request = { cla: 0xe0, ins: 0x02, p1: 0x01, p2: 0x01, fragment: new Opaque(bytes) }
    const response = await device.tryRequest(request).then(r => r.throw(t).throw(t).bytes)

    const cursor = new Cursor(response)

    const uncompressedPublicKeyLength = cursor.tryReadUint8().throw(t)
    const uncompressedPublicKey = cursor.tryRead(uncompressedPublicKeyLength).throw(t)

    const addressLength = cursor.tryReadUint8().throw(t)
    const address = `0x${Bytes.toAscii(cursor.tryRead(addressLength).throw(t))}`

    const chaincode = cursor.tryRead(32).throw(t)

    return new Ok({ uncompressedPublicKey, address, chaincode })
  })
}

export async function trySignPersonalMessage(device: LedgerDevice, path: string, message: Uint8Array): Promise<Result<SignatureInit, Error>> {
  return await Result.unthrow(async t => {
    const paths = Paths.from(path)

    const reader = new Cursor(message)

    let response: Bytes

    {
      const head = paths.trySize().get() + 4
      const body = Math.min(150 - head, reader.remaining)

      const chunk = reader.tryRead(body).throw(t)

      const writer = Cursor.tryAllocUnsafe(head + body).throw(t)
      paths.tryWrite(writer).throw(t)
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

    const cursor = new Cursor(response)
    const v = cursor.tryReadUint8().throw(t)
    const r = cursor.tryRead(32).throw(t)
    const s = cursor.tryRead(32).throw(t)

    return new Ok({ v, r, s })
  })
}