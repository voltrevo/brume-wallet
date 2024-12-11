import { Outline } from "@/libs/icons/icons"
import { PaddedRoundedClickableNakedButton } from "@/libs/ui/button"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { useCallback } from "react"
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
    <PageHeader title="Plugins">
      <PaddedRoundedClickableNakedButton
        onClick={onAdd}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedClickableNakedButton>
    </PageHeader>
    <div className="po-md flex items-center">
      <div className="text-contrast">
        {`Plugins allow you to securely extend the features. These features can then be used by applications you connect to.`}
      </div>
    </div>
  </>

  return <UserPage>
    {Header}
    {Body}
  </UserPage>
}