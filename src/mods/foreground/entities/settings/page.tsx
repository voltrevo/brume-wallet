import { useInputChange } from "@/libs/react/events";
import { TextAnchor } from "@/libs/ui/anchor/anchor";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { Ok } from "@hazae41/result";
import { PageBody, PageHeader } from "../../components/page/header";
import { Page } from "../../components/page/page";
import { useLogs } from "./data";

export function SettingsPage() {
  const logs = useLogs()

  const onLogsChange = useInputChange(e => {
    const checked = e.currentTarget.checked
    logs.mutate(() => new Ok(new Some(new Data(checked))))
  }, [])

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
          type="checkbox"
          checked={Boolean(logs.real?.current.inner)}
          onChange={onLogsChange}
        />
      </label>
      <div className="po-md text-sm text-contrast">
        All your requests will be seen on <TextAnchor href="https://logs.brume.money" />
      </div>
    </PageBody>
  </Page>
}