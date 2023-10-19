import { Outline } from "@/libs/icons/icons";
import { OptionalBackProps } from "@/libs/react/props/back";
import { ChildrenProps } from "@/libs/react/props/children";
import { TitleProps } from "@/libs/react/props/title";
import { Button } from "@/libs/ui/button";

export function PageHeader(props: TitleProps & ChildrenProps & OptionalBackProps) {
  const { title, children, back } = props

  return <div className="p-4 flex items-center">
    {back && <div className="mr-2">
      <Button.Naked className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
        onClick={back}>
        <Button.Shrinker>
          <Outline.ChevronLeftIcon className="s-sm" />
        </Button.Shrinker>
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

  return <div className="p-4 flex flex-col grow">
    {children}
  </div>
}