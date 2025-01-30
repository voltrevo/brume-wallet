import { Outline } from "@/libs/icons/icons"
import { OkProps } from "@/libs/react/props/promise"
import { PaddedRoundedClickableNakedAnchor } from "@/libs/ui/anchor"
import { Dialog } from "@/libs/ui/dialog"
import { Menu } from "@/libs/ui/menu"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { useLocaleContext } from "@/mods/foreground/global/mods/locale"
import { Locale } from "@/mods/foreground/locale"
import { UserGuardBody } from "@/mods/foreground/user/mods/guard"
import { Seed } from "@/mods/universal/entities/seeds"
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin"
import { Fragment, useCallback } from "react"
import { NewRectangularAnchorCard } from "../../wallets/all/page"
import { RawSeedDataCard } from "../card"
import { SeedDataProvider } from "../context"
import { useSeeds } from "../data"
import { SeedCreatorMenu } from "./create"
import { LedgerSeedCreatorDialog } from "./create/hardware"
import { StandaloneSeedCreatorDialog } from "./create/mnemonic"

export function SeedsPage() {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()

  const hash = useHashSubpath(path)

  const create = useCoords(hash, "/create")

  return <UserPage>
    <PageHeader title={Locale.get(Locale.Seeds, locale)}>
      <PaddedRoundedClickableNakedAnchor
        onKeyDown={create.onKeyDown}
        onClick={create.onClick}
        href={create.href}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedClickableNakedAnchor>
    </PageHeader>
    <div className="po-2 flex items-center">
      <div className="text-default-contrast">
        {`Seeds allow you to generate wallets from a single secret. You can import a seed from a mnemonic phrase or connect a hardware wallet.`}
      </div>
    </div>
    <UserGuardBody>
      <SeedsBody />
    </UserGuardBody>
  </UserPage>
}

export function SeedsBody() {
  const path = usePathContext().getOrThrow()

  const seedsQuery = useSeeds()
  const maybeSeeds = seedsQuery.data?.get()

  const hash = useHashSubpath(path)

  const onSeedClick = useCallback((seed: Seed) => {
    location.assign(`#/seed/${seed.uuid}`)
  }, [])

  return <PageBody>
    <HashSubpathProvider>
      {hash.url.pathname === "/create" &&
        <Menu>
          <SeedCreatorMenu />
        </Menu>}
      {hash.url.pathname === "/create/mnemonic" &&
        <Dialog>
          <StandaloneSeedCreatorDialog />
        </Dialog>}
      {hash.url.pathname === "/create/hardware" &&
        <Dialog>
          <LedgerSeedCreatorDialog />
        </Dialog>}
    </HashSubpathProvider>
    <ClickableSeedGrid
      ok={onSeedClick}
      maybeSeeds={maybeSeeds} />
  </PageBody>
}

export function ClickableSeedGrid(props: OkProps<Seed> & { maybeSeeds?: Seed[] } & { disableNew?: boolean }) {
  const { ok, maybeSeeds, disableNew } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {maybeSeeds?.map(seed =>
      <Fragment key={seed.uuid}>
        <ClickableSeedCard
          seed={seed}
          ok={ok} />
      </Fragment>)}
    {!disableNew &&
      <NewRectangularAnchorCard>
        New seed
      </NewRectangularAnchorCard>}
  </div>
}

export function ClickableSeedCard(props: { seed: Seed } & OkProps<Seed>) {
  const { seed, ok } = props

  const onClick = useCallback(() => {
    ok(seed)
  }, [ok, seed])

  return <div className={`w-full aspect-video rounded-xl overflow-hidden cursor-pointer hovered-or-clicked-or-focused:scale-105 !transition-transform`}
    role="button"
    onClick={onClick}>
    <SeedDataProvider uuid={seed.uuid}>
      <RawSeedDataCard />
    </SeedDataProvider>
  </div>
}
