import { Colors } from "@/libs/colors/colors";
import { Button } from "@/libs/components/button";
import { Dialog } from "@/libs/components/dialog/dialog";
import { Input } from "@/libs/components/input";
import { Textarea } from "@/libs/components/textarea";
import { Emojis } from "@/libs/emojis/emojis";
import { Errors } from "@/libs/errors/errors";
import { Ethereum } from "@/libs/ethereum/ethereum";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { Promises } from "@/libs/promises/promises";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { CloseProps } from "@/libs/react/props/close";
import { WebAuthnStorage } from "@/libs/webauthn/webauthn";
import { Mutators } from "@/libs/xswr/mutators";
import { EthereumWalletData, Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Bytes } from "@hazae41/bytes";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { secp256k1 } from "@noble/curves/secp256k1";
import * as Ethers from "ethers";
import { useEffect, useMemo, useState } from "react";
import { WalletAvatar } from "../avatar";
import { useWallets } from "./data";

export namespace Wallets {

  export function tryRandom() {
    return Result.catchAndWrapSync(() => Ethers.Wallet.createRandom().privateKey)
  }

  export function tryFrom(privateKey: string) {
    return Result.catchAndWrapSync(() => new Ethers.Wallet(privateKey))
  }

}

export function WalletCreatorDialog(props: CloseProps) {
  const { close } = props

  const background = useBackground()
  const wallets = useWallets(background)

  const uuid = useMemo(() => {
    return crypto.randomUUID()
  }, [])

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [name = "", setName] = useState<string>()

  const onNameChange = useInputChange(e => {
    setName(e.currentTarget.value)
  }, [])

  const [key = "", setKey] = useState<string>()

  const onKeyChange = useTextAreaChange(e => {
    setKey(e.currentTarget.value)
  }, [])

  useEffect(() => {
    Promises.fork().then(() => setKey(Wallets.tryRandom().ok().inner))
  }, [])

  const ethersWallet = useAsyncReplaceMemo(async () => {
    if (key) return Wallets.tryFrom(key).ok().inner
  }, [key])

  const [error, setError] = useState<Error>()

  const encryptedPrivateKeyResult = useAsyncReplaceMemo(async () => {
    return await Result.unthrow<Result<[string, string], Error>>(async t => {
      if (!ethersWallet)
        return new Err(new Panic())

      const privateKeyBytes = Bytes.fromHexSafe(ethersWallet.privateKey.slice(2))

      const plainBase64 = Bytes.toBase64(privateKeyBytes)

      const [ivBase64, cipherBase64] = await background.tryRequest<[string, string]>({
        method: "brume_encrypt",
        params: [plainBase64]
      }).then(r => r.throw(t).throw(t))

      return new Ok([ivBase64, cipherBase64])
    })
  }, [ethersWallet, background])

  const tryAddWallet = useAsyncUniqueCallback(async (authenticated: boolean) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!name || !ethersWallet || !encryptedPrivateKeyResult)
        return new Err(new Panic())

      const privateKeyBytes = Bytes.fromHexSafe(ethersWallet.privateKey.slice(2))

      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
      // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

      const privateKey = `0x${Bytes.toHex(privateKeyBytes)}`
      const address = Ethereum.Address.from(uncompressedPublicKeyBytes)

      // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
      // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

      let wallet: EthereumWalletData

      if (authenticated) {
        const [ivBase64, cipherBase64] = encryptedPrivateKeyResult.throw(t)

        const idBase64 = await WebAuthnStorage
          .create(name, Bytes.fromBase64(cipherBase64))
          .then(r => Bytes.toBase64(r.throw(t)))

        const privateKey = { ivBase64, idBase64 }

        wallet = { coin: "ethereum", type: "authPrivateKey", uuid, name, color, emoji, address, privateKey }
      } else {
        wallet = { coin: "ethereum", type: "privateKey", uuid, name, color, emoji, address, privateKey }
      }

      const walletsData = await background.tryRequest<Wallet[]>({
        method: "brume_newWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      wallets.mutate(Mutators.data(walletsData))

      close()

      return Ok.void()
    }).then(r => r.inspectErrSync(setError))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid, name, color, emoji, ethersWallet, background, encryptedPrivateKeyResult, wallets.mutate, close])

  const onNoAuthClick = useAsyncUniqueCallback(async () => {
    await tryAddWallet.run(false)
  }, [tryAddWallet])

  const onAuthClick = useAsyncUniqueCallback(async () => {
    await tryAddWallet.run(true)
  }, [tryAddWallet])

  const NameInput =
    <div className="flex items-stretch gap-2">
      <div className="shrink-0">
        <WalletAvatar className="icon-5xl text-2xl"
          colorIndex={color}
          emoji={emoji} />
      </div>
      <Input.Contrast className="w-full"
        placeholder="Enter a name"
        value={name} onChange={onNameChange} />
    </div>

  const KeyInput =
    <Textarea.Contrast className="w-full resize-none"
      placeholder="Enter your private key"
      value={key} onChange={onKeyChange}
      rows={4} />

  const Info =
    <div className="text-contrast">
      {`We have generated a new private key just for you. You can also enter your own private key to import an existing wallet.`}
    </div>

  const NoAuthButton =
    <Button.Contrast className="w-full p-md"
      disabled={!name || !ethersWallet}
      onClick={onNoAuthClick.run}>
      <Button.Shrink>
        <Outline.PlusIcon className="icon-sm" />
        Add without authentication
      </Button.Shrink>
    </Button.Contrast>

  const AuthButton =
    <Button.Gradient className="w-full p-md"
      colorIndex={color}
      disabled={!name || !ethersWallet}
      onClick={onAuthClick.run}>
      <Button.Shrink>
        <Outline.LockClosedIcon className="icon-sm" />
        Add with authentication
      </Button.Shrink>
    </Button.Gradient>

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New wallet
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-4" />
    {KeyInput}
    <div className="h-2" />
    {Info}
    {error && <div className="mt-2 text-red-400">
      An error occured: {Errors.toString(error)}
    </div>}
    <div className="h-4" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {NoAuthButton}
      {AuthButton}
    </div>
  </Dialog>
}
