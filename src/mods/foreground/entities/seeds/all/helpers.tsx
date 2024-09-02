import { Background } from "@/mods/foreground/background/background"
import { AuthMnemonicSeedData, LedgerSeedData, SeedData, UnauthMnemonicSeedData } from "@/mods/universal/entities/seeds/data"
import { Base16 } from "@hazae41/base16"
import { Base64 } from "@hazae41/base64"
import { Bytes, Uint8Array } from "@hazae41/bytes"
import { Abi, ZeroHexSignature, ZeroHexString } from "@hazae41/cubane"
import { Ledger } from "@hazae41/ledger"
import { Option } from "@hazae41/option"
import { Panic } from "@hazae41/result"
import { WebAuthnStorage } from "@hazae41/webauthnstorage"
import { HDKey } from "@scure/bip32"
import { entropyToMnemonic, mnemonicToSeed } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english"
import { Transaction, ethers } from "ethers"

export type SeedInstance =
  | UnauthMnemonicSeedInstance
  | AuthMnemonicSeedInstance
  | LedgerSeedInstance

export namespace SeedInstance {

  export async function createOrThrow(seed: SeedData, background: Background) {
    if (seed.type === "mnemonic")
      return new UnauthMnemonicSeedInstance(seed)
    if (seed.type === "authMnemonic")
      return new AuthMnemonicSeedInstance(seed)
    if (seed.type === "ledger")
      return new LedgerSeedInstance(seed)
    return seed satisfies never
  }

}

export class UnauthMnemonicSeedInstance {

  constructor(
    readonly data: UnauthMnemonicSeedData
  ) { }

  async getMnemonicOrThrow(background: Background): Promise<string> {
    return this.data.mnemonic
  }

  async getPrivateKeyOrThrow(path: string, background: Background): Promise<ZeroHexString> {
    const mnemonic = await this.getMnemonicOrThrow(background)
    const masterSeed = await mnemonicToSeed(mnemonic)

    const root = HDKey.fromMasterSeed(masterSeed)
    const child = root.derive(path)

    const privateKeyBytes = Option.wrap(child.privateKey).getOrThrow()

    return `0x${Base16.get().getOrThrow().encodeOrThrow(privateKeyBytes)}` as ZeroHexString
  }

  async signPersonalMessageOrThrow(path: string, message: string, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(path, background)

    const signature = await new ethers.Wallet(privateKey).signMessage(message)

    return signature as ZeroHexString
  }

  async signTransactionOrThrow(path: string, transaction: Transaction, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(path, background)

    const signature = new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized

    return signature as ZeroHexString
  }

  async signEIP712HashedMessageOrThrow(path: string, data: Abi.Typed.TypedData, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(path, background)

    delete (data.types as any)["EIP712Domain"]

    const signature = await new ethers.Wallet(privateKey).signTypedData(data.domain as any, data.types as any, data.message)

    return signature as ZeroHexString
  }

}

export class AuthMnemonicSeedInstance {

  constructor(
    readonly data: AuthMnemonicSeedData
  ) { }

  async getMnemonicOrThrow(background: Background): Promise<string> {
    const { idBase64, ivBase64 } = this.data.mnemonic

    using id = Base64.get().getOrThrow().decodePaddedOrThrow(idBase64)

    const cipher = await WebAuthnStorage.getOrThrow(id.bytes.slice())
    const cipherBase64 = Base64.get().getOrThrow().encodePaddedOrThrow(cipher)

    const entropyBase64 = await background.requestOrThrow<string>({
      method: "brume_decrypt",
      params: [ivBase64, cipherBase64]
    }).then(r => r.getOrThrow())

    using entropy = Base64.get().getOrThrow().decodePaddedOrThrow(entropyBase64)

    return entropyToMnemonic(entropy.bytes.slice(), wordlist)
  }

  async getPrivateKeyOrThrow(path: string, background: Background): Promise<ZeroHexString> {
    const mnemonic = await this.getMnemonicOrThrow(background)
    const masterSeed = await mnemonicToSeed(mnemonic)

    const root = HDKey.fromMasterSeed(masterSeed)
    const child = root.derive(path)

    const privateKeyBytes = Option.wrap(child.privateKey).getOrThrow()

    return `0x${Base16.get().getOrThrow().encodeOrThrow(privateKeyBytes)}` as ZeroHexString
  }

  async signPersonalMessageOrThrow(path: string, message: string, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(path, background)

    const signature = await new ethers.Wallet(privateKey).signMessage(message)

    return signature as ZeroHexString
  }

  async signTransactionOrThrow(path: string, transaction: Transaction, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(path, background)

    const signature = new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized

    return signature as ZeroHexString
  }

  async signEIP712HashedMessageOrThrow(path: string, data: Abi.Typed.TypedData, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(path, background)

    delete (data.types as any)["EIP712Domain"]

    const signature = await new ethers.Wallet(privateKey).signTypedData(data.domain as any, data.types as any, data.message)

    return signature as ZeroHexString
  }

}

export class LedgerSeedInstance {

  constructor(
    readonly data: LedgerSeedData
  ) { }

  async getMnemonicOrThrow(background: Background): Promise<string> {
    throw new Panic(`Unimplemented`)
  }

  async getPrivateKeyOrThrow(path: string, background: Background): Promise<ZeroHexString> {
    throw new Panic(`Unimplemented`)
  }

  async signPersonalMessageOrThrow(path: string, message: string, background: Background): Promise<ZeroHexString> {
    const device = await Ledger.USB.getOrRequestDeviceOrThrow()
    const connector = await Ledger.USB.connectOrThrow(device)
    const signature = await Ledger.Ethereum.signPersonalMessageOrThrow(connector, path.slice(2), Bytes.fromUtf8(message))

    return ZeroHexSignature.fromOrThrow(signature).value
  }

  async signTransactionOrThrow(path: string, transaction: Transaction, background: Background): Promise<ZeroHexString> {
    const device = await Ledger.USB.getOrRequestDeviceOrThrow()
    const connector = await Ledger.USB.connectOrThrow(device)

    using slice = Base16.get().getOrThrow().padStartAndDecodeOrThrow(transaction.unsignedSerialized.slice(2))
    const signature = await Ledger.Ethereum.signTransactionOrThrow(connector, path.slice(2), slice.bytes)

    return ZeroHexSignature.fromOrThrow(signature).value
  }

  async signEIP712HashedMessageOrThrow(path: string, data: Abi.Typed.TypedData, background: Background): Promise<ZeroHexString> {
    const device = await Ledger.USB.getOrRequestDeviceOrThrow()
    const connector = await Ledger.USB.connectOrThrow(device)

    delete (data.types as any)["EIP712Domain"]

    const encoder = new ethers.TypedDataEncoder(data.types as any)

    using domain = Base16.get().getOrThrow().padStartAndDecodeOrThrow(ethers.TypedDataEncoder.hashDomain(data.domain as any).slice(2))
    using message = Base16.get().getOrThrow().padStartAndDecodeOrThrow(encoder.hashStruct(data.primaryType, data.message).slice(2))

    const domainBytes = domain.bytes.slice() as Uint8Array<32>
    const messageBytes = message.bytes.slice() as Uint8Array<32>

    const signature = await Ledger.Ethereum.signEIP712HashedMessageOrThrow(connector, path.slice(2), domainBytes, messageBytes)

    return ZeroHexSignature.fromOrThrow(signature).value
  }

}
