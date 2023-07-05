import { Button } from "@/libs/components/button";
import { Outline } from "@/libs/icons/icons";
import { OptionalBackProps } from "@/libs/react/props/back";
import { ChildrenProps } from "@/libs/react/props/children";
import { TitleProps } from "@/libs/react/props/title";

export function PageHeader(props: TitleProps & ChildrenProps & OptionalBackProps) {
  const { title, children, back } = props

  return <div className="p-xmd flex items-center">
    {back && <div className="mr-2">
      <Button.Naked className="icon-xl hovered-or-clicked:scale-105 transition"
        onClick={back}>
        <Button.Shrink>
          <Outline.ChevronLeftIcon className="icon-sm" />
        </Button.Shrink>
      </Button.Naked>
    </div>}
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