import { Outline } from "@/libs/icons/icons"
import { Button } from "@/libs/ui/button"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"

export function SnapsPage() {
  const Body =
    <PageBody>
      Coming soon...
    </PageBody>

  const Header =
    <PageHeader title="Plugins">
      <button className={`${Button.Base.className} s-xl hovered-or-clicked-or-focused:scale-105 !transition`}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.PlusIcon className="s-sm" />
        </div>
      </button>
    </PageHeader>

  return <Page>
    {Header}
    {Body}
  </Page>
}