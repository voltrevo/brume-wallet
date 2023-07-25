import { Opaque, Readable, Writable } from "@hazae41/binary"
import { Bytes } from "@hazae41/bytes"
import { Err, Ok, Result } from "@hazae41/result"
import { ApduRequest, ApduRequestInit } from "../../libs/apdu/request"
import { ApduResponse } from "../../libs/apdu/response"
import { HIDContainer, HIDFrame } from "../../libs/hid/frame"

export const VENDOR_ID = 0x2c97
export const PACKET_SIZE = 64

export class DeviceNotFoundError extends Error {
  readonly #class = DeviceNotFoundError
  readonly name = this.#class.name

  constructor(options?: ErrorOptions) {
    super(`Could not find device`, options)
  }

  static from(cause: unknown) {
    return new DeviceNotFoundError({ cause })
  }
}

export class DeviceOpenError extends Error {
  readonly #class = DeviceOpenError
  readonly name = this.#class.name

  constructor(options?: ErrorOptions) {
    super(`Could not open device`, options)
  }

  static from(cause: unknown) {
    return new DeviceOpenError({ cause })
  }
}


export class DeviceConfigError extends Error {
  readonly #class = DeviceConfigError
  readonly name = this.#class.name

  constructor(options?: ErrorOptions) {
    super(`Could not configure device`, options)
  }

  static from(cause: unknown) {
    return new DeviceConfigError({ cause })
  }
}

export class DeviceResetError extends Error {
  readonly #class = DeviceResetError
  readonly name = this.#class.name

  constructor(options?: ErrorOptions) {
    super(`Could not reset device`, options)
  }

  static from(cause: unknown) {
    return new DeviceResetError({ cause })
  }
}

export class DeviceInterfaceNotFoundError extends Error {
  readonly #class = DeviceInterfaceNotFoundError
  readonly name = this.#class.name

  constructor(options?: ErrorOptions) {
    super(`Could not find device interface`, options)
  }

  static from(cause: unknown) {
    return new DeviceInterfaceNotFoundError({ cause })
  }
}

export class DeviceInterfaceClaimError extends Error {
  readonly #class = DeviceInterfaceClaimError
  readonly name = this.#class.name

  constructor(options?: ErrorOptions) {
    super(`Could not claim device interface`, options)
  }

  static from(cause: unknown) {
    return new DeviceInterfaceClaimError({ cause })
  }
}

export class DeviceTransferOutError extends Error {
  readonly #class = DeviceTransferOutError
  readonly name = this.#class.name

  constructor(options?: ErrorOptions) {
    super(`Could not transfer data to device`, options)
  }

  static from(cause: unknown) {
    return new DeviceTransferOutError({ cause })
  }
}

export class DeviceTransferInError extends Error {
  readonly #class = DeviceTransferInError
  readonly name = this.#class.name

  constructor(options?: ErrorOptions) {
    super(`Could not transfer data from device`, options)
  }

  static from(cause: unknown) {
    return new DeviceTransferInError({ cause })
  }
}

export async function tryConnect(): Promise<Result<LedgerDevice, Error>> {
  return await Result.unthrow(async t => {
    const device = await Result.catchAndWrap(async () => {
      return await navigator.usb.requestDevice({ filters: [{ vendorId: VENDOR_ID }] })
    }).then(r => r.mapErrSync(DeviceNotFoundError.from).throw(t))

    await Result.catchAndWrap(async () => {
      return await device.open()
    }).then(r => r.mapErrSync(DeviceOpenError.from).throw(t))

    if (device.configuration == null)
      await Result.catchAndWrap(async () => {
        return await device.selectConfiguration(1)
      }).then(r => r.mapErrSync(DeviceConfigError.from).throw(t))

    await Result.catchAndWrap(async () => {
      return await device.reset()
    }).then(r => r.mapErrSync(DeviceResetError.from).inspectErrSync(console.warn))

    const iface = device.configurations[0].interfaces.find(({ alternates }) =>
      alternates.some(x => x.interfaceClass === 255))

    if (iface == null)
      return new Err(new DeviceInterfaceNotFoundError())

    await Result.catchAndWrap(async () => {
      return await device.claimInterface(iface.interfaceNumber)
    }).then(r => r.mapErrSync(DeviceInterfaceClaimError.from).throw(t))

    return new Ok(new LedgerDevice(device, iface))
  })
}

export class LedgerDevice {
  readonly channel = Math.floor(Math.random() * 0xffff)

  constructor(
    readonly device: USBDevice,
    readonly iface: USBInterface
  ) { }

  async #tryTransferOut(frame: HIDFrame<Opaque>): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const bytes = Writable.tryWriteToBytes(frame).throw(t)

      console.log("->", bytes)

      await Result.catchAndWrap(async () => {
        await this.device.transferOut(3, bytes)
      }).then(r => r.mapErrSync(DeviceTransferOutError.from).throw(t))

      return Ok.void()
    })
  }

  async #tryTransferIn(length: number): Promise<Result<HIDFrame<Opaque>, Error>> {
    return await Result.unthrow(async t => {
      const result = await Result.catchAndWrap(async () => {
        return await this.device.transferIn(3, length)
      }).then(r => r.mapErrSync(DeviceTransferInError.from).throw(t))

      if (result.data == null)
        return new Err(new DeviceTransferInError())

      const bytes = Bytes.fromView(result.data)

      console.log("<-", bytes)

      const frame = Readable.tryReadFromBytes(HIDFrame, bytes).throw(t)

      return new Ok(frame)
    })
  }

  async #trySend<T extends Writable.Infer<T>>(fragment: T): Promise<Result<void, Error | Writable.SizeError<T> | Writable.WriteError<T>>> {
    return await Result.unthrow(async t => {
      const container = HIDContainer.tryNew(fragment).throw(t)
      const bytes = Writable.tryWriteToBytes(container).throw(t)

      const frames = HIDFrame.trySplit(this.channel, bytes)

      let frame = frames.next()

      for (; !frame.done; frame = frames.next())
        await this.#tryTransferOut(frame.value).then(r => r.throw(t))
      frame.value.throw(t)

      return Ok.void()
    })
  }

  async *#tryReceive() {
    while (true) {
      const frame = await this.#tryTransferIn(64)

      if (frame.isErr())
        return frame
      else
        yield frame.get()
    }
  }

  async tryRequest<T extends Writable.Infer<T>>(init: ApduRequestInit<T>): Promise<Result<ApduResponse<Opaque>, Error | Writable.SizeError<T> | Writable.WriteError<T>>> {
    return await Result.unthrow(async t => {
      const request = ApduRequest.tryFrom(init).throw(t)
      await this.#trySend(request).then(r => r.throw(t))

      const bytes = await HIDFrame.tryUnsplit(this.channel, this.#tryReceive()).then(r => r.throw(t))
      const response = Readable.tryReadFromBytes(ApduResponse, bytes).throw(t)

      return new Ok(response)
    })
  }

}