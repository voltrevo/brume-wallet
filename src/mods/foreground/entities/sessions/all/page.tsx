/* eslint-disable @next/next/no-img-element */
import { Button } from "@/libs/components/button"
import { Errors } from "@/libs/errors/errors"
import { Outline } from "@/libs/icons/icons"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { Session } from "@/mods/background/service_worker/entities/sessions/data"
import { useBackground } from "@/mods/foreground/background/context"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { Ok, Result } from "@hazae41/result"
import { useOrigin } from "../../origins/data"
import { usePersistentSession } from "../data"
import { useSessions } from "./data"

export function SessionsPage() {
  const background = useBackground()

  const sessionsQuery = useSessions()
  const maybeSessions = sessionsQuery.data?.inner

  const tryDisconnectAll = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (maybeSessions == null)
        return Ok.void()
      if (!confirm(`Do you want to disconnect all sessions?`))
        return Ok.void()

      for (const { id } of maybeSessions)
        await background.tryRequest({
          method: "brume_disconnect",
          params: [id]
        }).then(r => r.throw(t).throw(t))

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [background, maybeSessions])

  const Body =
    <PageBody>
      <div className="flex flex-col gap-2">
        {maybeSessions?.map(session =>
          <SessionRow
            key={session.id}
            session={session} />)}
      </div>
    </PageBody>

  const Header =
    <PageHeader title="Sessions">
      <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
        disabled={tryDisconnectAll.loading || !Boolean(maybeSessions?.length)}
        onClick={tryDisconnectAll.run}>
        <Outline.TrashIcon className="s-sm" />
      </Button.Naked>
    </PageHeader>

  return <Page>
    {Header}
    {Body}
  </Page>
}

export function SessionRow(props: { session: Session }) {
  const background = useBackground()

  const sessionQuery = usePersistentSession(props.session.origin)
  const maybeSessionData = sessionQuery.data?.inner

  const originQuery = useOrigin(maybeSessionData?.origin)
  const maybeOriginData = originQuery.data?.inner

  const tryDisconnect = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (maybeSessionData == null)
        return Ok.void()
      if (!confirm(`Do you want to disconnect this session?`))
        return Ok.void()

      await background.tryRequest({
        method: "brume_disconnect",
        params: [maybeSessionData.id]
      }).then(r => r.throw(t).throw(t))

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [background, maybeSessionData])

  if (maybeOriginData == null)
    return null

  return <div role="button" className="po-md rounded-xl flex items-center gap-4"
    onClick={tryDisconnect.run}>
    <div className="shrink-0">
      <img className="s-3xl"
        alt="icon"
        src={maybeOriginData.icon} />
    </div>
    <div className="grow">
      <div className="font-medium">
        {maybeOriginData.title}
      </div>
      <div className="text-contrast">
        {maybeOriginData.origin}
      </div>
    </div>
    <Button.Naked>
      <Button.Shrink>
        <Outline.EllipsisVerticalIcon className="s-sm" />
      </Button.Shrink>
    </Button.Naked>
  </div>
}