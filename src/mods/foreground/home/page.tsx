/* eslint-disable @next/next/no-img-element */
import { PageBody, UserPageHeader } from "@/libs/ui2/page/header"
import { Page } from "@/libs/ui2/page/page"
import { useBackgroundContext } from "@/mods/foreground/background/context"
import { useCallback, useEffect, useState } from "react"
import { useTotalPricedBalance } from "../entities/unknown/data"
import { useUserContext } from "../entities/users/context"
import { useDisplayUsd } from "../entities/wallets/page"

export function HomePage() {
  const userData = useUserContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const totalPricedBalanceQuery = useTotalPricedBalance("usd")
  const totalPricedBalanceDisplay = useDisplayUsd(totalPricedBalanceQuery.current)

  useEffect(() => {
    background.tryRequest({ method: "brume_log" }).then(r => r.inspectErrSync(console.warn))
  }, [background])

  const [persisted, setPersisted] = useState<boolean>()

  const getPersisted = useCallback(async () => {
    setPersisted(await navigator.storage.persist())
  }, [])

  useEffect(() => {
    getPersisted()

    if (background.isExtension())
      return
    if (navigator.userAgent.toLowerCase().includes("firefox"))
      return

    const t = setInterval(getPersisted, 1000)
    return () => clearTimeout(t)
  }, [background, getPersisted])

  const Body =
    <PageBody>
      <div className="h-[min(32rem,90dvh)] shrink-0 grow flex flex-col">
        <div className="grow" />
        <h1 className="text-center text-6xl font-medium">
          Welcome back<span className="text-contrast">, {userData.name}</span>
        </h1>
        <div className="grow" />
        <div className="grow" />
      </div>
      <div className="text-lg font-medium">
        Total balance
      </div>
      <div className="text-2xl font-bold">
        {totalPricedBalanceDisplay}
      </div>
      {persisted === false && background.isWebsite() || true && <>
        <div className="h-4" />
        <div className="p-4 bg-contrast rounded-xl">
          <h3 className="text-lg font-medium">
            Your storage is not persistent yet
          </h3>
          <p className="text-contrast">
            Please add this website to your favorites or to your home screen in order to enable persistent storage
          </p>
          <div className="h-2" />
        </div>
      </>}
      <div className="h-4" />
      <div className="p-4 bg-contrast shrink-0 h-[300px] rounded-xl flex flex-col items-center justify-center">
        <img src="/favicon.png" alt="logo" className="h-24 w-auto" />
        <div className="">
          Coming soon...
        </div>
      </div>
    </PageBody>

  const Header =
    <UserPageHeader title="Home" />

  return <Page>
    {Header}
    {Body}
  </Page>
}