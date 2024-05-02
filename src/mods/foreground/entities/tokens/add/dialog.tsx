import { Errors, UIError } from "@/libs/errors/errors";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { randomUUID } from "@/libs/uuid/uuid";
import { ContractTokenData } from "@/mods/background/service_worker/entities/tokens/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { useUserStorageContext } from "@/mods/foreground/storage/user";
import { Cubane, ZeroHexString } from "@hazae41/cubane";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { Ok, Panic, Result } from "@hazae41/result";
import { SyntheticEvent, useCallback, useDeferredValue, useMemo, useState } from "react";
import { FgEthereum } from "../../unknown/data";
import { SimpleInput, SimpleLabel, WideShrinkableOppositeButton } from "../../wallets/actions/send";
import { useWalletDataContext } from "../../wallets/context";
import { useToken } from "../data";

export function TokenAddDialog(props: {}) {
  const close = useCloseContext().unwrap()
  const wallet = useWalletDataContext().unwrap()
  const background = useBackgroundContext().unwrap()
  const storage = useUserStorageContext().unwrap()

  const [rawChainId, setRawChainId] = useState<string>("1")
  const defChainId = useDeferredValue(rawChainId)

  const onChainIdChange = useCallback((e: SyntheticEvent<HTMLSelectElement>) => {
    setRawChainId(e.currentTarget.value)
  }, [])

  const [rawAddress = "", setRawAddress] = useState<string>()
  const defAddress = useDeferredValue(rawAddress)

  const onAddressChange = useInputChange(e => {
    setRawAddress(e.currentTarget.value)
  }, [])

  const chain = chainByChainId[Number(defChainId)]
  const token = useToken(chain.chainId, defAddress)

  const addOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (!ZeroHexString.is(defAddress))
      throw new UIError(`Invalid address`)

    const name = await Result.unthrow<Result<string, Error>>(async t => {
      const context = { uuid: wallet.uuid, background, chain }
      const signature = Cubane.Abi.FunctionSignature.tryParse("name()").throw(t)
      const data = Cubane.Abi.tryEncode(signature.from()).throw(t)

      const schema = FgEthereum.Unknown.schema<ZeroHexString>({
        method: "eth_call",
        params: [{
          to: defAddress,
          data: data
        }, "pending"]
      }, context, storage)

      if (schema == null)
        throw new Panic()

      const result = await schema.refetch().then(r => r.real?.current.throw(t))

      const returns = Cubane.Abi.Tuple.create(Cubane.Abi.String)
      const [name] = Cubane.Abi.tryDecode(returns, result!).throw(t).intoOrThrow()

      return new Ok(name)
    }).then(r => r.unwrap())

    const symbol = await Result.unthrow<Result<string, Error>>(async t => {
      const context = { uuid: wallet.uuid, background, chain }
      const signature = Cubane.Abi.FunctionSignature.tryParse("symbol()").throw(t)
      const data = Cubane.Abi.tryEncode(signature.from()).throw(t)

      const schema = FgEthereum.Unknown.schema<ZeroHexString>({
        method: "eth_call",
        params: [{
          to: defAddress,
          data: data
        }, "pending"]
      }, context, storage)

      if (schema == null)
        throw new Panic()

      const result = await schema.refetch().then(r => r.real?.current.throw(t))

      const returns = Cubane.Abi.Tuple.create(Cubane.Abi.String)
      const [symbol] = Cubane.Abi.tryDecode(returns, result!).throw(t).intoOrThrow()

      return new Ok(symbol)
    }).then(r => r.unwrap())

    const decimals = await Result.unthrow<Result<number, Error>>(async t => {
      const context = { uuid: wallet.uuid, background, chain }
      const signature = Cubane.Abi.FunctionSignature.tryParse("decimals()").throw(t)
      const data = Cubane.Abi.tryEncode(signature.from()).throw(t)

      const schema = FgEthereum.Unknown.schema<ZeroHexString>({
        method: "eth_call",
        params: [{
          to: defAddress,
          data: data
        }, "pending"]
      }, context, storage)

      if (schema == null)
        throw new Panic()

      const result = await schema.refetch().then(r => r.real?.current.throw(t))

      const returns = Cubane.Abi.Tuple.create(Cubane.Abi.Uint8)
      const [decimals] = Cubane.Abi.tryDecode(returns, result!).throw(t).intoOrThrow()

      return new Ok(Number(decimals))
    }).then(r => r.unwrap())

    await token.mutate(s => {
      const data = new Data<ContractTokenData>({
        uuid: randomUUID(),
        type: "contract",
        chainId: chain.chainId,
        address: defAddress,
        name: name,
        symbol: symbol,
        decimals: decimals
      })

      return new Some(data)
    })

    close()
  }), [background, close, chain, defAddress])

  const addDisabled = useMemo(() => {
    if (!defAddress)
      return `Please enter an address`
    return
  }, [defAddress])

  return <>
    <Dialog.Title>
      New token
    </Dialog.Title>
    <div className="h-4" />
    <SimpleLabel>
      <div className="shrink-0">
        Chain
      </div>
      <div className="w-4 grow" />
      <select className="text-right bg-transparent outline-none overflow-ellipsis overflow-x-hidden appearance-none"
        value={rawChainId}
        onChange={onChainIdChange}>
        {Object.values(chainByChainId).map(x =>
          <option key={x.chainId} value={x.chainId.toString()}>
            {x.name}
          </option>)}
      </select>
    </SimpleLabel>
    <div className="h-2" />
    <SimpleLabel>
      <div className="shrink-0">
        Address
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="0x..."
        value={rawAddress}
        onChange={onAddressChange} />
    </SimpleLabel>
    <div className="h-4 grow" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      <WideShrinkableOppositeButton
        disabled={Boolean(addDisabled)}
        onClick={addOrAlert.run}>
        <Outline.PlusIcon className="size-5" />
        {addDisabled || "Send"}
      </WideShrinkableOppositeButton>
    </div>
  </>
}