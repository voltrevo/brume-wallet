import { Signature } from "@/libs/ethereum/mods/signature"
import { WebAuthnStorage } from "@/libs/webauthn/webauthn"
import { AuthMnemonicSeedData, LedgerSeedData, SeedData, UnauthMnemonicSeedData } from "@/mods/background/service_worker/entities/seeds/data"
import { Background } from "@/mods/foreground/background/background"
import { Base16 } from "@hazae41/base16"
import { Base64 } from "@hazae41/base64"
import { Bytes } from "@hazae41/bytes"
import { Abi, ZeroHexString } from "@hazae41/cubane"
import { Ledger } from "@hazae41/ledger"
import { Option } from "@hazae41/option"
import { Err, Ok, Panic, Result } from "@hazae41/result"
import { HDKey } from "@scure/bip32"
import { entropyToMnemonic, mnemonicToSeed } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english"
import { Transaction, ethers } from "ethers"

export type SeedInstance =
  | UnauthMnemonicSeedInstance
  | AuthMnemonicSeedInstance
  | LedgerSeedInstance

export namespace SeedInstance {

  export async function tryFrom(seed: SeedData, background: Background) {
    if (seed.type === "mnemonic")
      return new Ok(new UnauthMnemonicSeedInstance(seed))
    if (seed.type === "authMnemonic")
      return new Ok(new AuthMnemonicSeedInstance(seed))
    if (seed.type === "ledger")
      return new Ok(new LedgerSeedInstance(seed))
    throw new Panic()
  }

}

export class UnauthMnemonicSeedInstance {

  constructor(
    readonly data: UnauthMnemonicSeedData
  ) { }

  async tryGetMnemonic(background: Background): Promise<Result<string, Error>> {
    return new Ok(this.data.mnemonic)
  }

  async tryGetPrivateKey(path: string, background: Background): Promise<Result<ZeroHexString, Error>> {
    return await Result.unthrow(async t => {
      const mnemonic = await this.tryGetMnemonic(background).then(r => r.throw(t))
      const masterSeed = await mnemonicToSeed(mnemonic)

      const root = HDKey.fromMasterSeed(masterSeed)
      const child = root.derive(path)

      const privateKeyBytes = Option.wrap(child.privateKey).ok().throw(t)

      return new Ok(`0x${Base16.get().tryEncode(privateKeyBytes).throw(t)}` as ZeroHexString)
    })
  }

  async trySignPersonalMessage(path: string, message: string, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signMessage(message)
      }).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

  async trySignTransaction(path: string, transaction: Transaction, background: Background): Promise<Result<ZeroHexString, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      const signature = Result.runAndDoubleWrapSync(() => {
        return new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized as ZeroHexString
      }).throw(t)

      return new Ok(signature)
    })
  }

  async trySignEIP712HashedMessage(path: string, data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      delete (data.types as any)["EIP712Domain"]

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signTypedData(data.domain as any, data.types as any, data.message)
      }).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

}

export class AuthMnemonicSeedInstance {

  constructor(
    readonly data: AuthMnemonicSeedData
  ) { }

  async tryGetMnemonic(background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const { idBase64, ivBase64 } = this.data.mnemonic

      const id = Base64.get().tryDecodePadded(idBase64).throw(t).copyAndDispose()
      const cipher = await WebAuthnStorage.tryGet(id).then(r => r.throw(t))
      const cipherBase64 = Base64.get().tryEncodePadded(cipher).throw(t)

      const entropyBase64 = await background.requestOrThrow<string>({
        method: "brume_decrypt",
        params: [ivBase64, cipherBase64]
      }).then(r => r.throw(t))

      const entropy = Base64.get().tryDecodePadded(entropyBase64).throw(t).copyAndDispose()

      return new Ok(entropyToMnemonic(entropy, wordlist))
    })
  }

  async tryGetPrivateKey(path: string, background: Background): Promise<Result<ZeroHexString, Error>> {
    return await Result.unthrow(async t => {
      const mnemonic = await this.tryGetMnemonic(background).then(r => r.throw(t))
      const masterSeed = await mnemonicToSeed(mnemonic)

      const root = HDKey.fromMasterSeed(masterSeed)
      const child = root.derive(path)

      const privateKeyBytes = Option.wrap(child.privateKey).ok().throw(t)

      return new Ok(`0x${Base16.get().tryEncode(privateKeyBytes).throw(t)}` as ZeroHexString)
    })
  }

  async trySignPersonalMessage(path: string, message: string, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signMessage(message)
      }).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

  async trySignTransaction(path: string, transaction: Transaction, background: Background): Promise<Result<ZeroHexString, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      const signature = Result.runAndDoubleWrapSync(() => {
        return new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized as ZeroHexString
      }).throw(t)

      return new Ok(signature)
    })
  }

  async trySignEIP712HashedMessage(path: string, data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      delete (data.types as any)["EIP712Domain"]

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signTypedData(data.domain as any, data.types as any, data.message)
      }).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

}

export class LedgerSeedInstance {

  constructor(
    readonly data: LedgerSeedData
  ) { }

  async tryGetMnemonic(background: Background): Promise<Result<string, Error>> {
    return new Err(new Error(`Unimplemented`))
  }

  async tryGetPrivateKey(path: string, background: Background): Promise<Result<ZeroHexString, Error>> {
    return new Err(new Error(`Unimplemented`))
  }

  async trySignPersonalMessage(path: string, message: string, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const device = await Ledger.USB.getOrRequestDeviceOrThrow()
      const connector = await Ledger.USB.connectOrThrow(device)
      const signature = await Ledger.Ethereum.trySignPersonalMessage(connector, path.slice(2), Bytes.fromUtf8(message)).then(r => r.throw(t))

      return Signature.tryFrom(signature)
    })
  }

  async trySignTransaction(path: string, transaction: Transaction, background: Background): Promise<Result<ZeroHexString, Error>> {
    return await Result.unthrow(async t => {
      const device = await Ledger.USB.getOrRequestDeviceOrThrow()
      const connector = await Ledger.USB.connectOrThrow(device)

      using slice = Base16.get().padStartAndDecodeOrThrow(transaction.unsignedSerialized.slice(2))
      const signature = await Ledger.Ethereum.trySignTransaction(connector, path.slice(2), slice.bytes).then(r => r.throw(t))

      return Signature.tryFrom(signature)
    })
  }

  async trySignEIP712HashedMessage(path: string, data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const device = await Ledger.USB.getOrRequestDeviceOrThrow()
      const connector = await Ledger.USB.connectOrThrow(device)

      delete (data.types as any)["EIP712Domain"]

      const encoder = Result.runAndDoubleWrapSync(() => {
        return new ethers.TypedDataEncoder(data.types as any)
      }).throw(t)

      const domain = Result.runAndDoubleWrapSync(() => {
        return Base16.get().tryPadStartAndDecode(ethers.TypedDataEncoder.hashDomain(data.domain as any).slice(2)).unwrap().copyAndDispose()
      }).throw(t) as Bytes<32>

      const message = Result.runAndDoubleWrapSync(() => {
        return Base16.get().tryPadStartAndDecode(encoder.hashStruct(data.primaryType, data.message).slice(2)).unwrap().copyAndDispose()
      }).throw(t) as Bytes<32>

      const signature = await Ledger.Ethereum.trySignEIP712HashedMessage(connector, path.slice(2), domain, message).then(r => r.throw(t))

      return Signature.tryFrom(signature)
    })
  }

}
