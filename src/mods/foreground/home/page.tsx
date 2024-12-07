/* eslint-disable @next/next/no-img-element */
import { isWebsite } from "@/libs/platform/platform"
import { PageBody } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { useBackgroundContext } from "@/mods/foreground/background/context"
import { useUserTotalPricedBalance } from "@/mods/universal/user/mods/balances/hooks"
import { useCallback, useEffect, useState } from "react"
import { useUserContext } from "../entities/users/context"
import { useDisplayUsd } from "../entities/wallets/page"

export function HomePage() {
  const userData = useUserContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const totalPricedBalanceQuery = useUserTotalPricedBalance()
  const totalPricedBalanceDisplay = useDisplayUsd(totalPricedBalanceQuery.data?.get())

  useEffect(() => {
    background.requestOrThrow({
      method: "brume_log"
    }).then(r => r.getOrThrow()).catch(console.error)
  }, [background])

  const [persisted, setPersisted] = useState<boolean>()

  const getPersisted = useCallback(async () => {
    setPersisted(await navigator.storage.persist())
  }, [])

  useEffect(() => {
    if (!isWebsite())
      return

    getPersisted()

    if (navigator.userAgent.toLowerCase().includes("firefox"))
      return

    const t = setInterval(getPersisted, 1000)
    return () => clearTimeout(t)
  }, [background, getPersisted])

  const Body =
    <PageBody>
      <div className="h-[max(24rem,100dvh_-_16rem)] flex-none flex flex-col items-center">
        <div className="grow" />
        <h1 className="text-center text-6xl font-medium">
          Welcome back<span className="text-contrast">, {userData.name}</span>
        </h1>
        <div className="grow" />
        {persisted === false && <>
          <div className="h-4" />
          <div className="p-4 bg-contrast rounded-xl max-w-xs">
            <h3 className="font-medium">
              Your storage is not persistent yet
            </h3>
            <p className="text-contrast">
              Please add this website to your favorites or to your home screen
            </p>
            <div className="h-2" />
          </div>
          <div className="h-4" />
        </>}
        <div className="grow" />
        <div className="grow" />
      </div>
      <div className="text-lg font-medium">
        Total balance
      </div>
      <div className="text-2xl font-bold">
        {totalPricedBalanceDisplay}
      </div>
      <div className="h-4" />
      <div className="p-4 bg-contrast flex-none h-[300px] rounded-xl flex flex-col items-center justify-center">
        <img src="/favicon.png" alt="logo" className="h-24 w-auto" />
        <div className="">
          Coming soon...
        </div>
      </div>
    </PageBody>

  return <UserPage>
    {Body}
  </UserPage>
}