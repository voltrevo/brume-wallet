import { Outline } from "@/libs/icons/icons"
import { ChildrenProps } from "@/libs/react/props/children"
import { ClassNameProps } from "@/libs/react/props/className"
import { ButtonProps } from "@/libs/react/props/html"
import { OptionalIconProps } from "@/libs/react/props/icon"

export default function Page() {
  return <div className="p-1">
    <NakedChip>
      <InnerChip icon={Outline.GlobeAltIcon}>
        Hello world
      </InnerChip>
    </NakedChip>
    <div className="h-1" />
    <NakedChip>
      <InnerChip>
        Hello world
      </InnerChip>
    </NakedChip>
  </div>
}

export function NakedChip(props: ButtonProps & ClassNameProps) {
  const { children, className, ...button } = props

  return <button className={`group disabled:opacity-50 p-sm rounded-full ${className}`}
    {...button}>
    {children}
  </button>
}

export function InnerChip(props: OptionalIconProps & ChildrenProps & ClassNameProps) {
  const { icon: Icon, children, className } = props

  return <div className={`flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform ${className}`}>
    {Icon && <Icon className="icon-xs" />}
    {children}
  </div>
}
