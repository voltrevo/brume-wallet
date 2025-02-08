import { ChildrenProps } from "@/libs/react/props/children";

export function UserPage(props: ChildrenProps) {
  const { children } = props

  return <>
    <div className="grow w-full flex flex-col overflow-y-scroll">
      <div className="grow w-full m-auto max-w-3xl flex flex-col">
        {children}
      </div>
    </div>
  </>
}

export function GlobalPage(props: ChildrenProps) {
  const { children } = props

  return <>
    <div className="grow w-full flex flex-col overflow-y-scroll">
      <div className="grow w-full m-auto max-w-3xl flex flex-col">
        {children}
      </div>
    </div>
  </>
}