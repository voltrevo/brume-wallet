import { Signature } from "@/libs/ethereum/mods/signature"
import { Ledger } from "@/libs/ledger"
import { WebAuthnStorage } from "@/libs/webauthn/webauthn"
import { Seeds, WalletsBySeed } from "@/mods/background/service_worker/entities/seeds/all/data"
import { AuthMnemonicSeedData, LedgerSeedData, SeedData, UnauthMnemonicSeedData } from "@/mods/background/service_worker/entities/seeds/data"
import { Background } from "@/mods/foreground/background/background"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { Base16 } from "@hazae41/base16"
import { Base64 } from "@hazae41/base64"
import { Bytes } from "@hazae41/bytes"
import { Abi } from "@hazae41/cubane"
import { useQuery } from "@hazae41/glacier"
import { Nullable, Option } from "@hazae41/option"
import { Err, Ok, Panic, Result, Unimplemented } from "@hazae41/result"
import { HDKey } from "@scure/bip32"
import { entropyToMnemonic, mnemonicToSeed } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english"
import { Transaction, ethers } from "ethers"

export function useSeeds() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(Seeds.Foreground.schema, [storage])
  useSubscribe(query as any, storage)
  return query
}

export function useWalletsBySeed(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(WalletsBySeed.Foreground.schema, [uuid, storage])
  useSubscribe(query as any, storage)
  return query
}

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

  async tryGetPrivateKey(path: string, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const mnemonic = await this.tryGetMnemonic(background).then(r => r.throw(t))
      const masterSeed = await mnemonicToSeed(mnemonic)

      const root = HDKey.fromMasterSeed(masterSeed)
      const child = root.derive(path)

      const privateKeyBytes = Option.wrap(child.privateKey).ok().throw(t)

      return new Ok(`0x${Base16.get().tryEncode(privateKeyBytes).throw(t)}`)
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

  async trySignTransaction(path: string, transaction: Transaction, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      const signature = Result.runAndDoubleWrapSync(() => {
        return new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized
      }).throw(t)

      return new Ok(signature)
    })
  }

  async trySignEIP712HashedMessage(path: string, data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      delete (data.types as any)["EIP712Domain"]

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signTypedData(data.domain, data.types, data.message)
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
      const cipher = await WebAuthnStorage.get(id).then(r => r.throw(t))
      const cipherBase64 = Base64.get().tryEncodePadded(cipher).throw(t)

      const entropyBase64 = await background.tryRequest<string>({
        method: "brume_decrypt",
        params: [ivBase64, cipherBase64]
      }).then(r => r.throw(t).throw(t))

      const entropy = Base64.get().tryDecodePadded(entropyBase64).throw(t).copyAndDispose()

      return new Ok(entropyToMnemonic(entropy, wordlist))
    })
  }

  async tryGetPrivateKey(path: string, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const mnemonic = await this.tryGetMnemonic(background).then(r => r.throw(t))
      const masterSeed = await mnemonicToSeed(mnemonic)

      const root = HDKey.fromMasterSeed(masterSeed)
      const child = root.derive(path)

      const privateKeyBytes = Option.wrap(child.privateKey).ok().throw(t)

      return new Ok(`0x${Base16.get().tryEncode(privateKeyBytes).throw(t)}`)
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

  async trySignTransaction(path: string, transaction: Transaction, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      const signature = Result.runAndDoubleWrapSync(() => {
        return new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized
      }).throw(t)

      return new Ok(signature)
    })
  }

  async trySignEIP712HashedMessage(path: string, data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(path, background).then(r => r.throw(t))

      delete (data.types as any)["EIP712Domain"]

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signTypedData(data.domain, data.types, data.message)
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
    return new Err(new Unimplemented())
  }

  async tryGetPrivateKey(path: string, background: Background): Promise<Result<string, Error>> {
    return new Err(new Unimplemented())
  }

  async trySignPersonalMessage(path: string, message: string, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const device = await Ledger.USB.tryConnect().then(r => r.throw(t))
      const signature = await Ledger.Ethereum.trySignPersonalMessage(device, path.slice(2), Bytes.fromUtf8(message)).then(r => r.throw(t))

      return Signature.tryFrom(signature)
    })
  }

  async trySignTransaction(path: string, transaction: Transaction, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const device = await Ledger.USB.tryConnect().then(r => r.throw(t))
      const signature = await Ledger.Ethereum.trySignTransaction(device, path.slice(2), transaction).then(r => r.throw(t))

      return Signature.tryFrom(signature)
    })
  }

  async trySignEIP712HashedMessage(path: string, data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const device = await Ledger.USB.tryConnect().then(r => r.throw(t))

      delete (data.types as any)["EIP712Domain"]

      const encoder = Result.runAndDoubleWrapSync(() => {
        return new ethers.TypedDataEncoder(data.types)
      }).throw(t)

      const domain = Result.runAndDoubleWrapSync(() => {
        return Base16.get().tryPadStartAndDecode(ethers.TypedDataEncoder.hashDomain(data.domain).slice(2)).unwrap().copyAndDispose()
      }).throw(t) as Bytes<32>

      const message = Result.runAndDoubleWrapSync(() => {
        return Base16.get().tryPadStartAndDecode(encoder.hashStruct(data.primaryType, data.message).slice(2)).unwrap().copyAndDispose()
      }).throw(t) as Bytes<32>

      const signature = await Ledger.Ethereum.trySignEIP712HashedMessage(device, path.slice(2), domain, message).then(r => r.throw(t))

      return Signature.tryFrom(signature)
    })
  }

}
