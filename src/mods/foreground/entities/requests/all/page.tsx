/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { Results } from "@/libs/results/results"
import { RpcErr, RpcError } from "@/libs/rpc"
import { Button } from "@/libs/ui/button"
import { qurl } from "@/libs/url/url"
import { AppRequest } from "@/mods/background/service_worker/entities/requests/data"
import { useBackground } from "@/mods/foreground/background/context"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { UserRejectionError } from "@/mods/foreground/errors/errors"
import { Path } from "@/mods/foreground/router/path"
import { Ok, Result } from "@hazae41/result"
import { useCallback } from "react"
import { useOrigin } from "../../origins/data"
import { useAppRequest } from "../data"
import { useAppRequests } from "./data"

export function RequestsPage() {
  const background = useBackground().unwrap()

  const requestsQuery = useAppRequests()
  const maybeRequests = requestsQuery.data?.inner

  const tryRejectAll = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (maybeRequests == null)
        return Ok.void()
      if (!confirm(`Do you want to reject all requests?`))
        return Ok.void()

      for (const { id } of maybeRequests)
        await background.tryRequest({
          method: "popup_data",
          params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
        }).then(r => r.throw(t).throw(t))

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [background, maybeRequests])

  const Body =
    <PageBody>
      <div className="flex flex-col gap-2">
        {maybeRequests?.map(request =>
          <RequestRow
            key={request.id}
            request={request} />)}
      </div>
    </PageBody>

  const Header =
    <PageHeader title="Requests">
      <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
        disabled={tryRejectAll.loading || !Boolean(maybeRequests?.length)}
        onClick={tryRejectAll.run}>
        <Button.Shrink>
          <Outline.TrashIcon className="s-sm" />
        </Button.Shrink>
      </Button.Naked>
    </PageHeader>

  return <Page>
    {Header}
    {Body}
  </Page>
}

export function RequestRow(props: { request: AppRequest }) {
  const requestQuery = useAppRequest(props.request.id)
  const maybeRequestData = requestQuery.data?.inner

  const originQuery = useOrigin(maybeRequestData?.origin)
  const maybeOriginData = originQuery.data?.inner

  const open = useCallback(async () => {
    if (maybeRequestData == null)
      return

    const { id, method, params } = maybeRequestData
    Path.go(qurl(`/${method}?id=${id}`, params))
  }, [maybeRequestData])

  if (maybeOriginData == null)
    return null

  return <div role="button" className="po-md rounded-xl flex items-center gap-4"
    onClick={open}>
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
  </div>
}