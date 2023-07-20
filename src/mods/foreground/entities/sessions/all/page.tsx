/* eslint-disable @next/next/no-img-element */
import { Button } from "@/libs/components/button"
import { Errors } from "@/libs/errors/errors"
import { Outline } from "@/libs/icons/icons"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { Session } from "@/mods/background/service_worker/entities/sessions/data"
import { useBackground } from "@/mods/foreground/background/context"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { Option } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
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
  const background = useBackground()

  const sessionQuery = useSession(props.session.id)
  const maybeSessionData = sessionQuery.data?.inner

  const originQuery = useOrigin(maybeSessionData?.origin)
  const maybeOriginData = originQuery.data?.inner

  const tryDisconnect = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!confirm(`Do you want to disconnect this session?`))
        return Ok.void()

      const sessionData = Option.wrap(maybeSessionData).ok().throw(t)

      await background.tryRequest({
        method: "brume_disconnect",
        params: [sessionData.id]
      }).then(r => r.throw(t).throw(t))

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [background, maybeSessionData])

  if (maybeOriginData == null)
    return null

  const sessionData = maybeSessionData
  const originData = maybeOriginData

  return <div role="button" className="p-md rounded-xl flex items-center gap-4"
    onClick={tryDisconnect.run}>
    <div className="shrink-0">
      <img className="s-10"
        alt="icon"
        src={originData.icon} />
    </div>
    <div className="grow">
      <div className="font-medium">
        {originData.title}
      </div>
      <div className="text-contrast">
        {originData.origin}
      </div>
    </div>
    <Button.Naked>
      <Button.Shrink>
        <Outline.EllipsisVerticalIcon className="icon-sm" />
      </Button.Shrink>
    </Button.Naked>
  </div>
}