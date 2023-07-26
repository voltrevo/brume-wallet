import { Signature } from "@/libs/ethereum/mods/signature"
import { Ledger } from "@/libs/ledger"
import { WebAuthnStorage } from "@/libs/webauthn/webauthn"
import { Seeds, WalletsBySeed } from "@/mods/background/service_worker/entities/seeds/all/data"
import { AuthMnemonicSeedData, LedgerSeedData, MnemonicSeedData, SeedData } from "@/mods/background/service_worker/entities/seeds/data"
import { Background } from "@/mods/foreground/background/background"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { useUserStorage } from "@/mods/foreground/storage/user"
import { Bytes } from "@hazae41/bytes"
import { Option, Optional } from "@hazae41/option"
import { Err, Ok, Panic, Result } from "@hazae41/result"
import { Core, useQuery } from "@hazae41/xswr"
import { HDKey } from "@scure/bip32"
import { entropyToMnemonic, mnemonicToSeed } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english"
import { trySignPrivateKey } from "../../wallets/data"

export function useSeeds() {
  const storage = useUserStorage().unwrap()
  const query = useQuery(Seeds.Foreground.schema, [storage])
  useSubscribe(query as any, storage)
  return query
}

export function useWalletsBySeed(uuid: Optional<string>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(WalletsBySeed.Foreground.schema, [uuid, storage])
  useSubscribe(query as any, storage)
  return query
}

export namespace SeedDatas {

  export async function trySignMnemonicSeed(seed: MnemonicSeedData, path: string, message: string, core: Core, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await tryGetSeedPrivateKey(seed, path, core, background).then(r => r.throw(t))
      const signature = await trySignPrivateKey(privateKey, message, core, background).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

  export async function trySignLedgerSeed(seed: LedgerSeedData, path: string, message: string, core: Core, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const device = await Ledger.USB.tryConnect().then(r => r.throw(t))
      const signature = await Ledger.Ethereum.trySignPersonalMessage(device, path.slice(2), Bytes.fromUtf8(message)).then(r => r.throw(t))

      return new Ok(Signature.from(signature))
    })
  }

  export async function trySignSeed(seed: SeedData, path: string, message: string, core: Core, background: Background) {
    if (seed.type === "mnemonic")
      return await trySignMnemonicSeed(seed, path, message, core, background)
    if (seed.type === "authMnemonic")
      return await trySignMnemonicSeed(seed, path, message, core, background)
    if (seed.type === "ledger")
      return await trySignLedgerSeed(seed, path, message, core, background)
    return new Err(new Panic(`Invalid seed type`))
  }

  export async function tryGetSeedPrivateKey(seed: SeedData, path: string, core: Core, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const mnemonic = await tryGetMnemonic(seed, core, background).then(r => r.throw(t))
      const masterSeed = await mnemonicToSeed(mnemonic)

      const root = HDKey.fromMasterSeed(masterSeed)
      const child = root.derive(path)

      const privateKeyBytes = Option.wrap(child.privateKey).ok().throw(t)

      return new Ok(`0x${Bytes.toHex(privateKeyBytes)}`)
    })
  }

  export async function tryGetAuthMnemonic(seed: AuthMnemonicSeedData, core: Core, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const { idBase64, ivBase64 } = seed.mnemonic

      const id = Bytes.fromBase64(idBase64)
      const cipher = await WebAuthnStorage.get(id).then(r => r.throw(t))
      const cipherBase64 = Bytes.toBase64(cipher)

      const entropyBase64 = await background.tryRequest<string>({
        method: "brume_decrypt",
        params: [ivBase64, cipherBase64]
      }).then(r => r.throw(t).throw(t))

      const entropy = Bytes.fromBase64(entropyBase64)

      return new Ok(entropyToMnemonic(entropy, wordlist))
    })
  }

  export async function tryGetMnemonic(seed: SeedData, core: Core, background: Background): Promise<Result<string, Error>> {
    if (seed.type === "mnemonic")
      return new Ok(seed.mnemonic)
    if (seed.type === "authMnemonic")
      return tryGetAuthMnemonic(seed, core, background)
    return new Err(new Panic(`Invalid seed type`))
  }
}
