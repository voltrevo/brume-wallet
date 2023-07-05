import { Outline } from "@/libs/icons/icons"
import { ClassNameProps } from "@/libs/react/props/className"
import { ButtonProps } from "@/libs/react/props/html"
import { InnerChip, NakedChip } from "./naked"

export default function Page() {
  return <div className="p-1">
    <ContrastChip>
      <InnerChip icon={Outline.GlobeAltIcon}>
        Hello world
      </InnerChip>
    </ContrastChip>
    <div className="h-1" />
    <ContrastChip>
      <InnerChip>
        Hello world
      </InnerChip>
    </ContrastChip>
  </div>
}

export function ContrastChip(props: ButtonProps & ClassNameProps) {
  const { children, className, ...others } = props

  return <NakedChip className={`text-contrast border border-contrast hovered-or-active-or-selected:text-default hovered-or-active-or-selected:border-opposite transition-colors ${className}`}
    {...others}>
    {children}
  </NakedChip>
}

