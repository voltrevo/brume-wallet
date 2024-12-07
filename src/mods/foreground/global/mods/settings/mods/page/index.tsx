import { GlobalPageHeader, PageBody } from "@/libs/ui/page/header";
import { GlobalPage } from "@/libs/ui/page/page";

export function GlobalSettingsPage() {
  return <GlobalPage>
    <GlobalPageHeader title="Settings" />
    <PageBody>
      <div className="po-md text-sm text-contrast uppercase">
        Language
      </div>
      <div className="po-md">
        Coming soon...
      </div>
    </PageBody>
  </GlobalPage>
}