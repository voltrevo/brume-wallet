import { ChildrenProps } from "@/libs/react/props/children"
import { ClassNameProps } from "@/libs/react/props/className"
import { ButtonProps } from "@/libs/react/props/html"
import { OptionalIconProps } from "@/libs/react/props/icon"
import { NakedButton } from "./button"

export function ButtonChip(props: ButtonProps & ClassNameProps) {
  const { children, className, ...button } = props

  return <NakedButton className={`p-sm rounded-full ${className}`}
    {...button}>
    {children}
  </NakedButton>
}

export function ContrastButtonChip(props: ButtonProps) {
  const { children, ...others } = props

  return <ButtonChip className="text-contrast border border-contrast hovered-or-active-or-selected:text-default hovered-or-active-or-selected:border-opposite transition-colors"
    {...others}>
    {children}
  </ButtonChip>
}

export function ButtonChipChildren(props: OptionalIconProps & ChildrenProps & ClassNameProps) {
  const { icon: Icon, children, className } = props

  return <div className={`flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform ${className}`}>
    {Icon && <Icon className="icon-xs" />}
    {children}
  </div>
}


