import { Color } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { OptionalBackProps } from "@/libs/react/props/back";
import { ChildrenProps } from "@/libs/react/props/children";
import { TitleProps } from "@/libs/react/props/title";
import { Button } from "@/libs/ui/button";
import { UserAvatar } from "../../../mods/foreground/entities/users/all/page";
import { useUserContext } from "../../../mods/foreground/entities/users/context";

export function GlobalPageHeader(props: TitleProps & ChildrenProps & OptionalBackProps) {
  const { title, children, back } = props

  return <div className="p-4 flex items-center">
    {back && <div className="mr-2">
      <button className={`${Button.Base.className} size-8 hovered-or-clicked-or-focused:scale-105 !transition`}
        onClick={back}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.ChevronLeftIcon className="size-5" />
        </div>
      </button>
    </div>}
    <div className="w-2" />
    <div className="text-2xl font-medium mb-0.5">
      {title}
    </div>
    <div className="grow" />
    {children}
  </div>
}

export function UserPageHeader(props: TitleProps & ChildrenProps & OptionalBackProps) {
  const userData = useUserContext().unwrap()
  const { title, children, back } = props

  return <div className="p-4 flex items-center">
    {back && <div className="mr-2">
      <button className={`${Button.Base.className} size-8 hovered-or-clicked-or-focused:scale-105 !transition`}
        onClick={back}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.ChevronLeftIcon className="size-5" />
        </div>
      </button>
    </div>}
    <button onClick={() => alert("This feature is not implemented yet")}>
      <UserAvatar className="size-7 text-lg"
        color={Color.get(userData.color)}
        name={userData.name} />
    </button>
    <div className="w-2" />
    <div className="text-2xl font-medium text-contrast mb-1">
      /
    </div>
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