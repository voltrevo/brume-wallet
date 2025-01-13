import { Errors } from "@/libs/errors/errors";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Objects } from "@/libs/objects/objects";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { ContrastSubtitleDiv } from "@/libs/ui/div";
import { ContrastLabel } from "@/libs/ui/label";
import { PageBody, PageHeader } from "@/libs/ui/page/header";
import { UserPage } from "@/libs/ui/page/page";
import { HashSelector } from "@/libs/ui/select";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { Data } from "@hazae41/glacier";
import { Option, Some } from "@hazae41/option";
import { useChain } from "../../../../../entities/settings/data";

export function UserSettingsPage() {
  const lang = useLocaleContext().getOrThrow()

  const chain = useChain()

  const setChainIdOrLogAndAlert = useAsyncUniqueCallback((value: string) => Errors.runOrLogAndAlert(async () => {
    await chain.mutateOrThrow(() => new Some(new Data(Number(value))))
  }), [])

  return <UserPage>
    <PageHeader title={Locale.get(Locale.Settings, lang)} />
    <PageBody>
      <ContrastSubtitleDiv>
        Compatibility
      </ContrastSubtitleDiv>
      <ContrastLabel>
        <div className="flex-none">
          Default chain
        </div>
        <div className="w-4 grow" />
        <HashSelector
          pathname="/chain"
          value={String(Option.wrap(chain.real?.current.get()).getOr(1))}
          ok={setChainIdOrLogAndAlert.run}>
          {Objects.fromEntries(Objects.values(chainDataByChainId).map(x => [String(x.chainId), x.name]))}
        </HashSelector>
      </ContrastLabel>
      <div className="po-md text-contrast">
        Use this parameter if some app requires a specific chain
      </div>
    </PageBody>
  </UserPage>
}