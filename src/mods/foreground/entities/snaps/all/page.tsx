import { Outline } from "@/libs/icons/icons"
import { Button } from "@/libs/ui/button"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { useCallback } from "react"
import { useSnaps } from "../data"

export function SnapsPage() {
  const snapsQuery = useSnaps()

  const onAdd = useCallback(() => {
    snapsQuery
  }, [])

  const Body =
    <PageBody>
      Coming soon...
    </PageBody>

  const Header = <>
    <PageHeader title="Plugins">
      <button className={`${Button.Base.className} s-xl hovered-or-clicked-or-focused:scale-105 !transition`}
        onClick={onAdd}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.PlusIcon className="s-sm" />
        </div>
      </button>
    </PageHeader>
    <div className="po-md flex items-center">
      <div className="text-contrast">
        {`Plugins allow you to securely extend the features. These features can then be used by applications you connect to.`}
      </div>
    </div>
  </>

  return <Page>
    {Header}
    {Body}
  </Page>
}