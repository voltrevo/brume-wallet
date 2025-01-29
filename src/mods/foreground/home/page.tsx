/* eslint-disable @next/next/no-img-element */
import { useDisplayUsd } from "@/libs/fixed"
import { isWebsite } from "@/libs/platform/platform"
import { WideClickableContrastButton } from "@/libs/ui/button"
import { PageBody } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { useBackgroundContext } from "@/mods/foreground/background/context"
import { useUserTotalPricedBalance } from "@/mods/universal/user/mods/balances/hooks"
import { useCallback, useEffect, useState } from "react"
import { useUserContext } from "../entities/users/context"
import { useLocaleContext } from "../global/mods/locale"
import { Locale } from "../locale"

export function HomePage() {
  const lang = useLocaleContext().getOrThrow()
  const userData = useUserContext().getOrThrow().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const totalPricedBalanceQuery = useUserTotalPricedBalance()
  const totalPricedBalanceDisplay = useDisplayUsd(totalPricedBalanceQuery.data?.get())

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

  const [ignored, setIgnored] = useState(false)

  const onIgnoreClick = useCallback(() => {
    setIgnored(true)
  }, [])

  const Body =
    <PageBody>
      <div className="h-[max(24rem,100dvh_-_16rem)] flex-none flex flex-col items-center">
        <div className="grow" />
        <h1 className="flex flex-col gap-2 text-center text-6xl font-medium"
          data-dir={Locale.get(Locale.direction, lang)}>
          <div>
            {Locale.get(Locale.Hello, lang)}
          </div>
          <div className="text-default-contrast">
            {userData.name}
          </div>
        </h1>
        <div className="grow" />
        {!persisted && !ignored && <>
          <div className="h-4" />
          <div className="p-4 bg-default-contrast rounded-xl max-w-sm">
            <h3 className="font-medium text-center text-lg">
              {`Your data won't be saved`}
            </h3>
            <div className="h-2" />
            <p className="text-default-contrast text-center">
              Add this website to your favorites or to your home screen if you want to keep your data
            </p>
            <div className="h-4" />
            <div className="flex items-center flex-wrap-reverse gap-2">
              <WideClickableContrastButton
                onClick={onIgnoreClick}>
                {`I don't care`}
              </WideClickableContrastButton>
            </div>
          </div>
          <div className="h-4" />
        </>}
        <div className="grow" />
        <div className="grow" />
      </div>
      <div className="text-lg font-medium">
        {Locale.get(Locale.TotalBalance, lang)}
      </div>
      <div className="text-2xl font-bold">
        {totalPricedBalanceDisplay}
      </div>
      <div className="h-4" />
      <div className="p-4 bg-default-contrast flex-none h-[300px] rounded-xl flex flex-col items-center justify-center">
        <img src="/favicon.png" alt="logo" className="h-24 w-auto" />
        <div className="">
          {Locale.get(Locale.ComingSoon, lang)}...
        </div>
      </div>
    </PageBody >

  return <UserPage>
    {Body}
  </UserPage>
}