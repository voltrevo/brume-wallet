import { Outline } from "@/libs/icons/icons"
import { OkProps } from "@/libs/react/props/promise"
import { Dialog2 } from "@/libs/ui/dialog/dialog"
import { Menu } from "@/libs/ui2/menu"
import { PageBody, UserPageHeader } from "@/libs/ui2/page/header"
import { Page } from "@/libs/ui2/page/page"
import { Seed } from "@/mods/universal/entities/seeds/data"
import { HashSubpathProvider, useHashSubpath, usePathContext } from "@hazae41/chemin"
import { useCallback } from "react"
import { useGenius } from "../../users/all/page"
import { PaddedRoundedShrinkableNakedAnchor } from "../../wallets/actions/send"
import { NewRectangularAnchorCard } from "../../wallets/all/page"
import { RawSeedDataCard } from "../card"
import { SeedDataProvider } from "../context"
import { useSeeds } from "../data"
import { SeedCreatorMenu } from "./create"
import { LedgerSeedCreatorDialog } from "./create/hardware"
import { StandaloneSeedCreatorDialog } from "./create/mnemonic"

export function SeedsPage() {
  const path = usePathContext().unwrap()

  const seedsQuery = useSeeds()
  const maybeSeeds = seedsQuery.data?.get()

  const subpath = useHashSubpath(path)
  const creator = useGenius(subpath, "/create")

  const onSeedClick = useCallback((seed: Seed) => {
    location.assign(`#/seed/${seed.uuid}`)
  }, [])

  const Body =
    <PageBody>
      <ClickableSeedGrid
        ok={onSeedClick}
        maybeSeeds={maybeSeeds} />
    </PageBody>

  const Header = <>
    <UserPageHeader title="Seeds">
      <PaddedRoundedShrinkableNakedAnchor
        onKeyDown={creator.onKeyDown}
        onClick={creator.onClick}
        href={creator.href}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedShrinkableNakedAnchor>
    </UserPageHeader>
    <div className="po-md flex items-center">
      <div className="text-contrast">
        {`Seeds allow you to generate wallets from a single secret. You can import a seed from a mnemonic phrase or connect a hardware wallet.`}
      </div>
    </div>
  </>
  return <Page>
    <HashSubpathProvider>
      {subpath.url.pathname === "/create" &&
        <Menu>
          <SeedCreatorMenu />
        </Menu>}
      {subpath.url.pathname === "/create/mnemonic" &&
        <Dialog2>
          <StandaloneSeedCreatorDialog />
        </Dialog2>}
      {subpath.url.pathname === "/create/hardware" &&
        <Dialog2>
          <LedgerSeedCreatorDialog />
        </Dialog2>}
    </HashSubpathProvider>
    {Header}
    {Body}
  </Page>
}

export function ClickableSeedGrid(props: OkProps<Seed> & { maybeSeeds?: Seed[] } & { disableNew?: boolean }) {
  const { ok, maybeSeeds, disableNew } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {maybeSeeds?.map(seed =>
      <ClickableSeedCard
        key={seed.uuid}
        seed={seed}
        ok={ok} />)}
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
