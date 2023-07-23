import { Outline } from "@/libs/icons/icons"
import { CreateProps } from "@/libs/react/props/create"
import { OkProps } from "@/libs/react/props/promise"
import { Button } from "@/libs/ui/button"
import { Seed } from "@/mods/background/service_worker/entities/seeds/data"
import { useBackground } from "@/mods/foreground/background/context"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { Path } from "@/mods/foreground/router/path"
import { useCallback } from "react"
import { useSeeds } from "./data"

export function SeedsPage() {
  const background = useBackground()

  const seedsQuery = useSeeds()
  const maybeSeeds = seedsQuery.data?.inner

  const onSeedClick = useCallback((seed: Seed) => {
    Path.go(`/seed/${seed.uuid}`)
  }, [])

  const Body =
    <PageBody>
      <ClickableSeedGrid
        ok={onSeedClick}
        create={() => { }}
        maybeSeeds={maybeSeeds} />
    </PageBody>

  const Header =
    <PageHeader title="Seeds">
      <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition">
        <Outline.PlusIcon className="s-sm" />
      </Button.Naked>
    </PageHeader>

  return <Page>
    {Header}
    {Body}
  </Page>
}

export function ClickableSeedGrid(props: OkProps<Seed> & CreateProps & { maybeSeeds?: Seed[] }) {

  return <div className="grid grow place-content-start place-items-center gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">

  </div>
}