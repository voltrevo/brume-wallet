import { Errors } from "@/libs/errors/errors";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { WideClickableOppositeButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastLabel } from "@/libs/ui/label";
import { Loading } from "@/libs/ui/loading";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { ContractTokenRef } from "@/mods/universal/ethereum/mods/tokens/mods/core";
import { useContractToken, useUserTokens } from "@/mods/universal/ethereum/mods/tokens/mods/core/hooks";
import { Address } from "@hazae41/cubane";
import { Data } from "@hazae41/glacier";
import { Option, Some } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { Fragment, SyntheticEvent, useCallback, useDeferredValue, useMemo, useState } from "react";
import { SimpleInput } from "../../wallets/actions/send";
import { useWalletDataContext } from "../../wallets/context";
import { useEthereumContext } from "../../wallets/data";

export function TokenAddDialog(props: {}) {
  const close = useCloseContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

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

  const maybeAddress = useMemo(() => {
    return Address.fromOrNull(defAddress)
  }, [defAddress])

  const chain = chainDataByChainId[Number(defChainId)]
  const context = useEthereumContext(wallet.uuid, chain).getOrThrow()

  const tokenQuery = useContractToken(context, maybeAddress, "latest")
  const tokensQuery = useUserTokens()

  const addOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const tokenData = Option.wrap(tokenQuery.data).getOrThrow().getOrThrow()

    await tokensQuery.mutateOrThrow(tokens => {
      const previous = tokens.real?.current

      if (previous == null)
        return new Some(new Data([ContractTokenRef.from(tokenData)]))

      return new Some(previous.mapSync(p => [...p, ContractTokenRef.from(tokenData)]))
    })

    close()
  }), [tokenQuery.data, close])

  const error = useMemo(() => {
    if (!defAddress)
      return `Please enter an address`
    if (maybeAddress == null)
      return `Invalid address`
    if (tokenQuery.data != null)
      return undefined
    if (tokenQuery.error != null)
      return `Could not fetch token`
    return `Loading...`
  }, [defAddress, maybeAddress, tokenQuery.data, tokenQuery.error])

  return <>
    <Dialog.Title>
      New token
    </Dialog.Title>
    <div className="h-4" />
    <ContrastLabel>
      <div className="flex-none">
        Chain
      </div>
      <div className="w-4 grow" />
      <select className="text-right bg-transparent outline-none text-ellipsis overflow-x-hidden appearance-none"
        value={rawChainId}
        onChange={onChainIdChange}>
        {Object.values(chainDataByChainId).map(x =>
          <Fragment key={x.chainId}>
            <option value={x.chainId.toString()}>
              {x.name}
            </option>
          </Fragment>)}
      </select>
    </ContrastLabel>
    <div className="h-2" />
    <ContrastLabel>
      <div className="flex-none">
        Address
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="0x..."
        value={rawAddress}
        onChange={onAddressChange} />
    </ContrastLabel>
    <div className="h-4 grow" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      <WideClickableOppositeButton
        disabled={error != null || addOrAlert.loading}
        onClick={addOrAlert.run}>
        {tokenQuery.fetching
          ? <Loading className="size-5" />
          : <Outline.PlusIcon className="size-5" />}
        {error || "Add"}
      </WideClickableOppositeButton>
    </div>
  </>
}