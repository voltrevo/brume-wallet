/* eslint-disable @next/next/no-img-element */
import { qurl } from "@/libs/url/url"
import { AppRequest } from "@/mods/background/service_worker/entities/requests/data"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { Path } from "@/mods/foreground/router/path"
import { useCallback } from "react"
import { useOrigin } from "../../origins/data"
import { useAppRequest } from "../data"
import { useAppRequests } from "./data"

export function RequestsPage() {
  const requests = useAppRequests()

  const Body =
    <PageBody>
      <div className="flex flex-col gap-2">
        {requests.data?.inner.map(request =>
          <RequestRow
            key={request.id}
            request={request} />)}
      </div>
    </PageBody>

  const Header =
    <PageHeader title="Requests" />

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