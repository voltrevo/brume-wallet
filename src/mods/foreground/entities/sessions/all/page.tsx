/* eslint-disable @next/next/no-img-element */
import { Button } from "@/libs/components/button"
import { Outline } from "@/libs/icons/icons"
import { Session } from "@/mods/background/service_worker/entities/sessions/data"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { useOrigin } from "../../origins/data"
import { useSession } from "../data"
import { useSessions } from "./data"

export function SessionsPage() {
  const sessions = useSessions()

  const Body =
    <PageBody>
      <div className="flex flex-col gap-2">
        {sessions.data?.inner.map(session =>
          <SessionRow
            key={session.id}
            session={session} />)}
      </div>
    </PageBody>

  const Header =
    <PageHeader title="Sessions" />

  return <Page>
    {Header}
    {Body}
  </Page>
}

export function SessionRow(props: { session: Session }) {
  const sessionQuery = useSession(props.session.id)
  const session = sessionQuery.data?.inner

  const originQuery = useOrigin(session?.origin)
  const origin = originQuery.data?.inner

  if (origin == null)
    return null

  return <div role="button" className="p-md rounded-xl flex items-center gap-4">
    <div className="shrink-0">
      <img className="s-10"
        alt="icon"
        src={origin.icon} />
    </div>
    <div className="grow">
      <div className="font-medium">
        {origin.title}
      </div>
      <div className="text-contrast">
        {origin.origin}
      </div>
    </div>
    <Button.Naked>
      <Button.Shrink>
        <Outline.EllipsisVerticalIcon className="icon-sm" />
      </Button.Shrink>
    </Button.Naked>
  </div>
}