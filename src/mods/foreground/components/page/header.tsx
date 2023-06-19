import { ChildrenProps } from "@/libs/react/props/children";
import { TitleProps } from "@/libs/react/props/title";

export function PageHeader(props: TitleProps & ChildrenProps) {
  const { title, children } = props

  return <div className="p-xmd flex items-center">
    <div className="text-2xl font-medium">
      {title}
    </div>
    <div className="grow" />
    {children}
  </div>
}

export function PageBody(props: ChildrenProps) {
  const { children } = props

  return <div className="p-xmd flex flex-col grow">
    {children}
  </div>
}