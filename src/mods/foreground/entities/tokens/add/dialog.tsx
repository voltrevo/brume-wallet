import { Errors, UIError } from "@/libs/errors/errors";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { Dialog } from "@/libs/ui/dialog";
import { randomUUID } from "@/libs/uuid/uuid";
import { ContractTokenData } from "@/mods/background/service_worker/entities/tokens/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { useUserStorageContext } from "@/mods/foreground/storage/user";
import { Cubane, ZeroHexString } from "@hazae41/cubane";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { Panic, Result } from "@hazae41/result";
import { SyntheticEvent, useCallback, useDeferredValue, useMemo, useState } from "react";
import { FgEthereum } from "../../unknown/data";
import { SimpleInput, SimpleLabel, WideShrinkableOppositeButton } from "../../wallets/actions/send";
import { useWalletDataContext } from "../../wallets/context";
import { FgEthereumContext } from "../../wallets/data";
import { useToken } from "../data";

export function TokenAddDialog(props: {}) {
  const close = useCloseContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()
  const storage = useUserStorageContext().getOrThrow()

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

  const chain = chainDataByChainId[Number(defChainId)]
  const token = useToken(chain.chainId, defAddress)

  const addOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!ZeroHexString.String.is(defAddress))
      throw new UIError(`Invalid address`)

    const name = await Result.runAndWrap(async () => {
      const context = new FgEthereumContext(wallet.uuid, chain, background)
      const signature = Cubane.Abi.FunctionSignature.parseOrThrow("name()")
      const data = Cubane.Abi.encodeOrThrow(signature.fromOrThrow())

      const schema = FgEthereum.Unknown.schema<ZeroHexString>({
        method: "eth_call",
        params: [{
          to: defAddress,
          data: data
        }, "pending"]
      }, context, storage)

      if (schema == null)
        throw new Panic()

      const result = await schema.fetchOrThrow().then(r => r.getAny().real?.current.getOrThrow())

      const returns = Cubane.Abi.Tuple.create(Cubane.Abi.String)
      const [name] = Cubane.Abi.decodeOrThrow(returns, result!).intoOrThrow()

      return name
    }).then(r => r.getOrThrow())

    const symbol = await Result.runAndWrap(async () => {
      const context = new FgEthereumContext(wallet.uuid, chain, background)
      const signature = Cubane.Abi.FunctionSignature.parseOrThrow("symbol()")
      const data = Cubane.Abi.encodeOrThrow(signature.fromOrThrow())

      const schema = FgEthereum.Unknown.schema<ZeroHexString>({
        method: "eth_call",
        params: [{
          to: defAddress,
          data: data
        }, "pending"]
      }, context, storage)

      if (schema == null)
        throw new Panic()

      const result = await schema.fetchOrThrow().then(r => r.getAny().real?.current.getOrThrow())

      const returns = Cubane.Abi.Tuple.create(Cubane.Abi.String)
      const [symbol] = Cubane.Abi.decodeOrThrow(returns, result!).intoOrThrow()

      return symbol
    }).then(r => r.getOrThrow())

    const decimals = await Result.runAndWrap(async () => {
      const context = new FgEthereumContext(wallet.uuid, chain, background)
      const signature = Cubane.Abi.FunctionSignature.parseOrThrow("decimals()")
      const data = Cubane.Abi.encodeOrThrow(signature.fromOrThrow())

      const schema = FgEthereum.Unknown.schema<ZeroHexString>({
        method: "eth_call",
        params: [{
          to: defAddress,
          data: data
        }, "pending"]
      }, context, storage)

      if (schema == null)
        throw new Panic()

      const result = await schema.fetchOrThrow().then(r => r.getAny().real?.current.getOrThrow())

      const returns = Cubane.Abi.Tuple.create(Cubane.Abi.Uint8)
      const [decimals] = Cubane.Abi.decodeOrThrow(returns, result!).intoOrThrow()

      return Number(decimals)
    }).then(r => r.getOrThrow())

    await token.mutateOrThrow(s => {
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
      <div className="flex-none">
        Chain
      </div>
      <div className="w-4 grow" />
      <select className="text-right bg-transparent outline-none overflow-ellipsis overflow-x-hidden appearance-none"
        value={rawChainId}
        onChange={onChainIdChange}>
        {Object.values(chainDataByChainId).map(x =>
          <option key={x.chainId} value={x.chainId.toString()}>
            {x.name}
          </option>)}
      </select>
    </SimpleLabel>
    <div className="h-2" />
    <SimpleLabel>
      <div className="flex-none">
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