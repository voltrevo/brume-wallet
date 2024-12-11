import { Outline } from "@/libs/icons/icons";
import { OptionalBackProps } from "@/libs/react/props/back";
import { ChildrenProps } from "@/libs/react/props/children";
import { TitleProps } from "@/libs/react/props/title";
import { RoundedClickableNakedButton } from "../button";

export function PageHeader(props: TitleProps & ChildrenProps & OptionalBackProps) {
  const { title, children, back } = props

  return <div className="p-4 flex items-center">
    {back && <div className="mr-2 flex items-center">
      <RoundedClickableNakedButton
        onClick={back}>
        <Outline.ChevronLeftIcon className="size-5" />
      </RoundedClickableNakedButton>
    </div>}
    <div className="w-2" />
    <div className="text-2xl font-medium mb-0.5">
      {title}
    </div>
    <div className="grow" />
    {children}
  </div>
}

export function PageBody(props: ChildrenProps) {
  const { children } = props

  return <div className="p-4 flex flex-col grow">
    {children}
  </div>
}