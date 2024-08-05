import { Color } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { OptionalBackProps } from "@/libs/react/props/back";
import { ChildrenProps } from "@/libs/react/props/children";
import { TitleProps } from "@/libs/react/props/title";
import { ButtonShrinkerDiv } from "@/libs/ui/shrinker";
import { RoundedShrinkableNakedButton } from "@/mods/foreground/entities/wallets/actions/send";
import { UserAvatar } from "../../../mods/foreground/entities/users/all/page";
import { useUserContext } from "../../../mods/foreground/entities/users/context";

export function GlobalPageHeader(props: TitleProps & ChildrenProps & OptionalBackProps) {
  const { title, children, back } = props

  return <div className="p-4 flex items-center">
    {back && <div className="mr-2">
      <RoundedShrinkableNakedButton
        onClick={back}>
        <ButtonShrinkerDiv>
          <Outline.ChevronLeftIcon className="size-5" />
        </ButtonShrinkerDiv>
      </RoundedShrinkableNakedButton>
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
      <RoundedShrinkableNakedButton
        onClick={back}>
        <ButtonShrinkerDiv>
          <Outline.ChevronLeftIcon className="size-5" />
        </ButtonShrinkerDiv>
      </RoundedShrinkableNakedButton>
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