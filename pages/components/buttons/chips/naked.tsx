import { Outline } from "@/libs/icons/icons"
import { ChildrenProps } from "@/libs/react/props/children"
import { ClassNameProps } from "@/libs/react/props/className"
import { ButtonProps } from "@/libs/react/props/html"
import { OptionalIconProps } from "@/libs/react/props/icon"
import { NakedButton } from "../naked"

export default function Page() {
  return <NakedButtonChip>
    <InnerButtonChip icon={Outline.GlobeAltIcon}>
      Hello world
    </InnerButtonChip>
  </NakedButtonChip>
}

export function NakedButtonChip(props: ButtonProps & ClassNameProps) {
  const { children, className, ...button } = props

  return <NakedButton className={`p-sm rounded-full ${className}`}
    {...button}>
    {children}
  </NakedButton>
}

export function InnerButtonChip(props: OptionalIconProps & ChildrenProps & ClassNameProps) {
  const { icon: Icon, children, className } = props

  return <div className={`flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform ${className}`}>
    {Icon && <Icon className="icon-xs" />}
    {children}
  </div>
}
