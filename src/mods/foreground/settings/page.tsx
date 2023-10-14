import { Anchor } from "@/libs/ui/anchor/anchor";
import { PageBody, PageHeader } from "../components/page/header";
import { Page } from "../components/page/page";

export function SettingsPage() {

  return <Page>
    <PageHeader title="Settings" />
    <PageBody>
      <div className="po-md text-sm text-contrast uppercase">
        Others
      </div>
      <label className="po-md bg-contrast rounded-xl flex items-center justify-between">
        <div className="">
          Enable logs
        </div>
        <input className=""
          type="checkbox" />
      </label>
      <div className="po-md text-sm text-contrast">
        All your requests will be seen on <Anchor href="https://logs.brume.money" />
      </div>
    </PageBody>


  </Page>
}