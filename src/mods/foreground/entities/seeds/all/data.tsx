import { WebAuthnStorage } from "@/libs/webauthn/webauthn"
import { Seeds, WalletsBySeed } from "@/mods/background/service_worker/entities/seeds/all/data"
import { SeedData } from "@/mods/background/service_worker/entities/seeds/data"
import { Background } from "@/mods/foreground/background/background"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { useUserStorage } from "@/mods/foreground/storage/user"
import { Bytes } from "@hazae41/bytes"
import { Optional } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
import { useQuery } from "@hazae41/xswr"
import { entropyToMnemonic } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english"

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

  export async function tryGetMnemonic(seed: SeedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      if (seed.type === "mnemonic")
        return new Ok(seed.mnemonic)

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
}
