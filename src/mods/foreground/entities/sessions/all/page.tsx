/* eslint-disable @next/next/no-img-element */
import { Button } from "@/libs/components/button"
import { Outline } from "@/libs/icons/icons"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { useSessions } from "./data"

export function SessionsPage() {
  const sessions = useSessions()

  const Body =
    <PageBody>
      {sessions.data?.inner.map(session =>
        <div role="button" className="p-md rounded-xl flex items-center gap-4"
          key={session.origin}>
          <div className="shrink-0">
            <img className="s-10"
              alt="icon"
              src="https://app.uniswap.org/favicon.png" />
          </div>
          <div className="grow">
            <div className="font-medium">
              Uniswap
            </div>
            <div className="text-contrast">
              {session.origin}
            </div>
          </div>
          <Button.Naked>
            <Button.Shrink>
              <Outline.EllipsisVerticalIcon className="icon-sm" />
            </Button.Shrink>
          </Button.Naked>
        </div>)}
    </PageBody>

  const Header =
    <PageHeader title="Sessions" />

  return <Page>
    {Header}
    {Body}
  </Page>
}