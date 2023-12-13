import { Outline } from "@/libs/icons/icons";
import { OptionalBackProps } from "@/libs/react/props/back";
import { ChildrenProps } from "@/libs/react/props/children";
import { TitleProps } from "@/libs/react/props/title";
import { Button } from "@/libs/ui/button";
import { UserAvatar } from "../../entities/users/all/page";
import { useUserContext } from "../../entities/users/context";

export function PageHeader(props: TitleProps & ChildrenProps & OptionalBackProps) {
  const userData = useUserContext().unwrap()
  const { title, children, back } = props

  return <div className="p-4 flex items-center">
    {back && <div className="mr-2">
      <Button.Base className="s-xl hovered-or-clicked-or-focused:scale-105 !transition"
        onClick={back}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.ChevronLeftIcon className="s-sm" />
        </div>
      </Button.Base>
    </div>}
    <button onClick={() => alert("This feature is not implemented yet")}>
      <UserAvatar className="mt-0.5 s-lg text-lg"
        colorIndex={userData.color}
        name={userData.name} />
    </button>
    <div className="w-2" />
    <div className="text-2xl font-medium text-contrast">
      /
    </div>
    <div className="w-2" />
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