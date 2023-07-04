import { Outline } from "@/libs/icons/icons";
import { OptionalBackProps } from "@/libs/react/props/back";
import { ChildrenProps } from "@/libs/react/props/children";
import { TitleProps } from "@/libs/react/props/title";
import { InnerButton, NakedButton } from "../../../../../pages/components/buttons/naked";

export function PageHeader(props: TitleProps & ChildrenProps & OptionalBackProps) {
  const { title, children, back } = props

  return <div className="p-xmd flex items-center">
    {back &&
      <NakedButton className="mr-2"
        onClick={back}>
        <InnerButton icon={Outline.ChevronLeftIcon} />
      </NakedButton>}
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