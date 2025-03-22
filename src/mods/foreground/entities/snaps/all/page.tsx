import { Outline } from "@/libs/icons"
import { PaddedRoundedClickableNakedButton } from "@/libs/ui/button"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { UserGuardBody } from "@/mods/foreground/user/mods/guard"
import { useCallback } from "react"

export function SnapsPage() {
  const onAdd = useCallback(() => {
    // TODO
  }, [])

  return <UserPage>
    <PageHeader title="Plugins">
      <PaddedRoundedClickableNakedButton
        onClick={onAdd}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedClickableNakedButton>
    </PageHeader>
    <div className="po-2 flex items-center">
      <div className="text-default-contrast">
        {`Plugins allow you to securely extend the features. These features can then be used by applications you connect to.`}
      </div>
    </div>
    <UserGuardBody>
      <SnapsBody />
    </UserGuardBody>
  </UserPage>
}

export function SnapsBody() {
  return <PageBody>
    Coming soon...
  </PageBody>
}