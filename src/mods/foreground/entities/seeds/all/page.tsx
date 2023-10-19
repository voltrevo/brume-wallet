import { Outline } from "@/libs/icons/icons"
import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { CreateProps } from "@/libs/react/props/create"
import { OkProps } from "@/libs/react/props/promise"
import { Button } from "@/libs/ui/button"
import { Seed } from "@/mods/background/service_worker/entities/seeds/data"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { Path } from "@/mods/foreground/router/path/context"
import { useCallback } from "react"
import { SeedDataCard } from "../card"
import { SeedDataProvider, useSeedData } from "../context"
import { SeedCreatorDialog } from "./create"
import { useSeeds } from "./data"

export function SeedsPage() {
  const seedsQuery = useSeeds()
  const maybeSeeds = seedsQuery.data?.inner

  const creator = useBooleanHandle(false)

  const onSeedClick = useCallback((seed: Seed) => {
    Path.go(`/seed/${seed.uuid}`)
  }, [])

  const Body =
    <PageBody>
      <ClickableSeedGrid
        ok={onSeedClick}
        create={creator.enable}
        maybeSeeds={maybeSeeds} />
    </PageBody>

  const Header =
    <PageHeader title="Seeds">
      <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
        onClick={creator.enable}>
        <Button.Shrinker>
          <Outline.PlusIcon className="s-sm" />
        </Button.Shrinker>
      </Button.Naked>
    </PageHeader>

  return <Page>
    {creator.current &&
      <SeedCreatorDialog
        close={creator.disable} />}
    {Header}
    {Body}
  </Page>
}

export function ClickableSeedGrid(props: OkProps<Seed> & CreateProps & { maybeSeeds?: Seed[] }) {
  const { ok, create, maybeSeeds } = props

  return <div className="grid grow place-content-start place-items-center gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {maybeSeeds?.map(seed =>
      <SeedDataProvider
        key={seed.uuid}
        uuid={seed.uuid}>
        <ClickableSeedDataCard ok={ok} />
      </SeedDataProvider>)}
    <NewSeedCard ok={create} />
  </div>
}

export function ClickableSeedDataCard(props: OkProps<Seed>) {
  const seed = useSeedData()
  const { ok } = props

  const onClick = useCallback(() => {
    ok(seed)
  }, [ok, seed])

  return <button className="w-full hovered-or-clicked-or-focused:scale-105 transition-transform"
    onClick={onClick}>
    <SeedDataCard />
  </button>
}

export function NewSeedCard(props: OkProps<unknown>) {
  const { ok } = props

  return <button className="po-md w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-contrast border-dashed hovered-or-clicked-or-focused:scale-105 transition-transform"
    onClick={ok}>
    <Outline.PlusIcon className="s-sm" />
    <div className="font-medium">
      New seed
    </div>
  </button>
}
