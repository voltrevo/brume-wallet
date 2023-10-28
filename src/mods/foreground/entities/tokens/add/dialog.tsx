import { UIError } from "@/libs/errors/errors";
import { ChainData, chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { ContractTokenData } from "@/mods/background/service_worker/entities/tokens/data";
import { useBackground } from "@/mods/foreground/background/context";
import { useUserStorage } from "@/mods/foreground/storage/user";
import { Cubane, ZeroHexString } from "@hazae41/cubane";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { useDeferredValue, useMemo, useState } from "react";
import { FgUnknown } from "../../unknown/data";
import { useWalletData } from "../../wallets/context";
import { useToken } from "../data";

export function TokenAddDialog(props: CloseProps) {
  const wallet = useWalletData()
  const background = useBackground().unwrap()
  const storage = useUserStorage().unwrap()
  const { close } = props

  const [chain, setChain] = useState<ChainData>(chainByChainId[1])

  const [rawAddress = "", setRawAddress] = useState<string>()
  const defAddress = useDeferredValue(rawAddress)

  const onAddressChange = useInputChange(e => {
    setRawAddress(e.currentTarget.value)
  }, [])

  const token = useToken(chain.chainId, defAddress)

  const onAddClick = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!ZeroHexString.is(defAddress))
        return new Err(new UIError(`Invalid address`))

      const name = await Result.unthrow<Result<string, Error>>(async t => {
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
          chainId: chain.chainId,
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
  }, [background, close, chain, defAddress])

  const addDisabled = useMemo(() => {
    if (!defAddress)
      return `Please enter an address`
    return
  }, [defAddress])

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New token
    </Dialog.Title>
    <div className="h-2" />
    <div className="flex flex-wrap items-center overflow-hidden gap-2">
      {Object.values(chainByChainId).map(x =>
        <button key={x.chainId}
          className={`${Button.Naked.className} po-sm border border-contrast shrink-0 data-[selected=true]:border-opposite transition-colors`}
          onClick={() => setChain(x)}
          data-selected={chain === x}>
          <div className={`${Button.Shrinker.className}`}>
            {x.name}
          </div>
        </button>)}
    </div>
    <div className="h-2" />
    <Input.Contrast className="w-full"
      placeholder="Contract address"
      value={rawAddress}
      onChange={onAddressChange} />
    <div className="h-4" />
    <Button.Gradient className="w-full po-md"
      colorIndex={wallet.color}
      disabled={Boolean(addDisabled)}
      onClick={onAddClick.run}>
      <Button.Shrinker>
        <Outline.PlusIcon className="s-sm" />
        {addDisabled || "Send"}
      </Button.Shrinker>
    </Button.Gradient>
  </Dialog>
}