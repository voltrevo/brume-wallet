import { Outline } from "@/libs/icons/icons"
import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { CreateProps } from "@/libs/react/props/create"
import { OkProps } from "@/libs/react/props/promise"
import { Button } from "@/libs/ui/button"
import { Dialog } from "@/libs/ui/dialog/dialog"
import { PageBody, UserPageHeader } from "@/libs/ui2/page/header"
import { Page } from "@/libs/ui2/page/page"
import { Seed } from "@/mods/background/service_worker/entities/seeds/data"
import { Paths } from "@/mods/foreground/router/path/context"
import { useCallback } from "react"
import { SeedDataCard } from "../card"
import { SeedDataProvider, useSeedDataContext } from "../context"
import { useSeeds } from "../data"
import { SeedCreatorDialog } from "./create"

export function SeedsPage() {
  const seedsQuery = useSeeds()
  const maybeSeeds = seedsQuery.data?.inner

  const creator = useBooleanHandle(false)

  const onSeedClick = useCallback((seed: Seed) => {
    Paths.go(`/seed/${seed.uuid}`)
  }, [])

  const Body =
    <PageBody>
      <ClickableSeedGrid
        ok={onSeedClick}
        create={creator.enable}
        maybeSeeds={maybeSeeds} />
    </PageBody>

  const Header = <>
    <UserPageHeader title="Seeds">
      <Button.Base className="size-8 hovered-or-clicked-or-focused:scale-105 !transition"
        onClick={creator.enable}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.PlusIcon className="size-5" />
        </div>
      </Button.Base>
    </UserPageHeader>
    <div className="po-md flex items-center">
      <div className="text-contrast">
        {`Seeds allow you to generate wallets from a single secret. You can import a seed from a mnemonic phrase or connect a hardware wallet.`}
      </div>
    </div>
  </>
  return <Page>
    <Dialog
      opened={creator.current}
      close={creator.disable}>
      <SeedCreatorDialog />
    </Dialog>
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
  const seed = useSeedDataContext()
  const { ok } = props

  const onClick = useCallback(() => {
    ok(seed)
  }, [ok, seed])

  return <button className="w-full hovered-or-clicked-or-focused:scale-105 !transition-transform"
    onClick={onClick}>
    <SeedDataCard />
  </button>
}

export function NewSeedCard(props: OkProps<unknown>) {
  const { ok } = props

  return <button className="po-md w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-contrast border-dashed hovered-or-clicked-or-focused:scale-105 !transition-transform"
    onClick={ok}>
    <Outline.PlusIcon className="size-5" />
    <div className="font-medium">
      New seed
    </div>
  </button>
}
