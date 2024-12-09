import { Errors } from "@/libs/errors/errors";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { ColoredTextAnchor } from "@/libs/ui/anchor";
import { ContrastLabel } from "@/libs/ui/label";
import { PageBody, UserPageHeader } from "@/libs/ui/page/header";
import { UserPage } from "@/libs/ui/page/page";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { ChangeEvent } from "react";
import { useChain, useLogs } from "../../../../../entities/settings/data";

export function UserSettingsPage() {
  const logs = useLogs()
  const chain = useChain()

  const onLogsChange = useAsyncUniqueCallback((e: ChangeEvent<HTMLInputElement>) => Errors.runOrLogAndAlert(async () => {
    const checked = e.currentTarget.checked
    await logs.mutateOrThrow(() => new Some(new Data(checked)))
  }), [])

  const onChainChange = useAsyncUniqueCallback((e: ChangeEvent<HTMLSelectElement>) => Errors.runOrLogAndAlert(async () => {
    const chainId = Number(e.currentTarget.value)
    await chain.mutateOrThrow(() => new Some(new Data(chainId)))
  }), [])

  return <UserPage>
    <UserPageHeader title="Settings" />
    <PageBody>
      <div className="po-md text-sm text-contrast uppercase">
        Compatibility
      </div>
      <ContrastLabel>
        <div className="flex-none">
          Default chain
        </div>
        <div className="w-4 grow" />
        <select className="text-right bg-transparent outline-none overflow-ellipsis overflow-x-hidden appearance-none"
          value={chain.real?.current.get()}
          onChange={onChainChange.run}>
          {Object.values(chainDataByChainId).map(x =>
            <option key={x.chainId} value={x.chainId}>
              {x.name}
            </option>)}
        </select>
      </ContrastLabel>
      <div className="po-md text-sm text-contrast">
        Use this parameter if some app requires a specific chain
      </div>
      <div className="h-4" />
      <div className="po-md text-sm text-contrast uppercase">
        Debugging
      </div>
      <ContrastLabel>
        <div className="flex-none">
          Enable logs
        </div>
        <div className="w-4 grow" />
        <input className="self-center"
          type="checkbox"
          checked={Boolean(logs.real?.current.get())}
          onChange={onLogsChange.run} />
      </ContrastLabel>
      <div className="po-md text-sm text-contrast">
        All your requests will be seen on <ColoredTextAnchor href="https://logs.brume.money" />
      </div>
    </PageBody>
  </UserPage>
}