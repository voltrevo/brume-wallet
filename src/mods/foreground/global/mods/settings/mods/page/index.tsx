import { GlobalPageHeader, PageBody } from "@/libs/ui/page/header";
import { UserPage } from "@/libs/ui/page/page";

export function GlobalSettingsPage() {
  return <UserPage>
    <GlobalPageHeader title="Settings" />
    <PageBody>
      <div className="po-md text-sm text-contrast uppercase">
        Language
      </div>
      <div className="po-md">
        Coming soon...
      </div>
    </PageBody>
  </UserPage>
}