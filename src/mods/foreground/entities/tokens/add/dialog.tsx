import { UIError } from "@/libs/errors/errors";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { Results } from "@/libs/results/results";
import { PositiveSafeInteger } from "@/libs/types/integers";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { ContractTokenData } from "@/mods/background/service_worker/entities/tokens/data";
import { useBackground } from "@/mods/foreground/background/context";
import { useUserStorage } from "@/mods/foreground/storage/user";
import { Cubane, ZeroHexString } from "@hazae41/cubane";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { useDeferredValue, useState } from "react";
import { FgUnknown } from "../../unknown/data";
import { useWalletData } from "../../wallets/context";
import { useToken } from "../data";

export function TokenAddDialog(props: CloseProps) {
  const wallet = useWalletData()
  const background = useBackground().unwrap()
  const storage = useUserStorage().unwrap()
  const { close } = props

  const [rawChainId = "", setRawChainId] = useState<string>()
  const defChainId = Number(useDeferredValue(rawChainId))

  const onChainIdChange = useInputChange(e => {
    setRawChainId(e.currentTarget.value)
  }, [])

  const [rawAddress = "", setRawAddress] = useState<string>()
  const defAddress = useDeferredValue(rawAddress)

  const onAddressChange = useInputChange(e => {
    setRawAddress(e.currentTarget.value)
  }, [])

  const token = useToken(Number(defChainId), defAddress)

  const onAddClick = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!PositiveSafeInteger.is(defChainId))
        return new Err(new UIError(`Invalid chainId`))
      if (!ZeroHexString.is(defAddress))
        return new Err(new UIError(`Invalid address`))

      const name = await Result.unthrow<Result<string, Error>>(async t => {
        const chain = chainByChainId[defChainId]
        const context = { uuid: wallet.uuid, background, chain }
        const signature = Cubane.Abi.FunctionSignature.tryParse("name()").throw(t)
        const data = Cubane.Abi.tryEncode(signature.args.from()).throw(t)

        const schema = FgUnknown.schema<ZeroHexString>({
          method: "eth_call",
          params: [{
            to: defAddress,
            data: data
          }, "pending"]
        }, context, storage)

        if (schema == null)
          throw new Panic()

        const result = await schema.tryFetch().then(r => r.throw(t).throw(t).real?.current.throw(t))

        const returns = Cubane.Abi.createDynamicTuple(Cubane.Abi.DynamicString)
        const [name] = Cubane.Abi.tryDecode(returns, result!).throw(t).inner

        return new Ok(name.value)
      }).then(r => r.throw(t))

      const symbol = await Result.unthrow<Result<string, Error>>(async t => {
        const chain = chainByChainId[defChainId]
        const context = { uuid: wallet.uuid, background, chain }
        const signature = Cubane.Abi.FunctionSignature.tryParse("symbol()").throw(t)
        const data = Cubane.Abi.tryEncode(signature.args.from()).throw(t)

        const schema = FgUnknown.schema<ZeroHexString>({
          method: "eth_call",
          params: [{
            to: defAddress,
            data: data
          }, "pending"]
        }, context, storage)

        if (schema == null)
          throw new Panic()

        const result = await schema.tryFetch().then(r => r.throw(t).throw(t).real?.current.throw(t))

        const returns = Cubane.Abi.createDynamicTuple(Cubane.Abi.DynamicString)
        const [symbol] = Cubane.Abi.tryDecode(returns, result!).throw(t).inner

        return new Ok(symbol.value)
      }).then(r => r.throw(t))

      const decimals = await Result.unthrow<Result<number, Error>>(async t => {
        const chain = chainByChainId[defChainId]
        const context = { uuid: wallet.uuid, background, chain }
        const signature = Cubane.Abi.FunctionSignature.tryParse("decimals()").throw(t)
        const data = Cubane.Abi.tryEncode(signature.args.from()).throw(t)

        const schema = FgUnknown.schema<ZeroHexString>({
          method: "eth_call",
          params: [{
            to: defAddress,
            data: data
          }, "pending"]
        }, context, storage)

        if (schema == null)
          throw new Panic()

        const result = await schema.tryFetch().then(r => r.throw(t).throw(t).real?.current.throw(t))

        const returns = Cubane.Abi.createDynamicTuple(Cubane.Abi.Uint8)
        const [decimals] = Cubane.Abi.tryDecode(returns, result!).throw(t).inner

        return new Ok(decimals.value)
      }).then(r => r.throw(t))

      await token.mutate(s => {
        const data = new Data<ContractTokenData>({
          uuid: crypto.randomUUID(),
          type: "contract",
          chainId: defChainId,
          address: defAddress,
          name: name,
          symbol: symbol,
          decimals: decimals
        })

        return new Ok(new Some(data))
      }).then(r => r.throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [background, close, defChainId, defAddress])

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New token
    </Dialog.Title>
    <input
      placeholder="chainId"
      value={rawChainId}
      onChange={onChainIdChange} />
    <input
      placeholder="address"
      value={rawAddress}
      onChange={onAddressChange} />
    <button className={`${Button.Naked.className} ${Button.Contrast.className}`}
      onClick={onAddClick.run}>
      Add
    </button>
  </Dialog>
}