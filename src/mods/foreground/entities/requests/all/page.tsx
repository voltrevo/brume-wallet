/* eslint-disable @next/next/no-img-element */
import { Button } from "@/libs/components/button"
import { Errors } from "@/libs/errors/errors"
import { Outline } from "@/libs/icons/icons"
import { RpcErr, RpcError } from "@/libs/rpc"
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
  const background = useBackground()

  const requestsQuery = useAppRequests()
  const requestsData = requestsQuery.data?.inner

  const clean = useCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (requestsData == null)
        return Ok.void()

      for (const { id } of requestsData)
        await background.tryRequest({
          method: "popup_data",
          params: [new RpcErr(id, RpcError.from(new UserRejectionError()))]
        }).then(r => r.throw(t))

      return Ok.void()
    }).then(r => r.inspectErrSync(e => alert(Errors.toString(e))))
  }, [background, requestsData])

  const Body =
    <PageBody>
      <div className="flex flex-col gap-2">
        {requestsQuery.data?.inner.map(request =>
          <RequestRow
            key={request.id}
            request={request} />)}
      </div>
    </PageBody>

  const Header =
    <PageHeader title="Requests">
      <Button.Naked className="icon-xl hovered-or-clicked-or-focused:scale-105 transition"
        onClick={clean}>
        <Outline.TrashIcon className="icon-sm" />
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

  const requestData = maybeRequestData
  const originData = maybeOriginData

  return <div role="button" className="p-md rounded-xl flex items-center gap-4"
    onClick={open}>
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
  </div>
}