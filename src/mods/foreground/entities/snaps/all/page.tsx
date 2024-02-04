import { Outline } from "@/libs/icons/icons"
import { PageBody, UserPageHeader } from "@/libs/ui2/page/header"
import { Page } from "@/libs/ui2/page/page"
import { useCallback } from "react"
import { PaddedRoundedShrinkableNakedButton } from "../../wallets/actions/send"
import { useSnaps } from "../data"

export function SnapsPage() {
  const snapsQuery = useSnaps()

  const onAdd = useCallback(() => {

  }, [])

  const Body =
    <PageBody>
      Coming soon...
    </PageBody>

  const Header = <>
    <UserPageHeader title="Plugins">
      <PaddedRoundedShrinkableNakedButton
        onClick={onAdd}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedShrinkableNakedButton>
    </UserPageHeader>
    <div className="po-md flex items-center">
      <div className="text-contrast">
        {`Plugins allow you to securely extend the features. These features can then be used by applications you connect to.`}
      </div>
    </div>
  </>

  return <Page>
    {Header}
    {Body}
  </Page>
}