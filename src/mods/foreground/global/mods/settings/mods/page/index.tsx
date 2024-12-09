import { ContrastSubtitleDiv } from "@/libs/ui/div";
import { GlobalPageHeader, PageBody } from "@/libs/ui/page/header";
import { GlobalPage } from "@/libs/ui/page/page";

export function GlobalSettingsPage() {
  return <GlobalPage>
    <GlobalPageHeader title="Settings" />
    <PageBody>
      <ContrastSubtitleDiv>
        Language
      </ContrastSubtitleDiv>
      <div className="po-md">
        Coming soon...
      </div>
    </PageBody>
  </GlobalPage>
}