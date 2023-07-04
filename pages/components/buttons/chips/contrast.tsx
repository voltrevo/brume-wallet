import { Outline } from "@/libs/icons/icons"
import { ClassNameProps } from "@/libs/react/props/className"
import { ButtonProps } from "@/libs/react/props/html"
import { InnerButtonChip, NakedButtonChip } from "./naked"

export default function Page() {
  return <ContrastButtonChip>
    <InnerButtonChip icon={Outline.GlobeAltIcon}>
      Hello world
    </InnerButtonChip>
  </ContrastButtonChip>
}

export function ContrastButtonChip(props: ButtonProps & ClassNameProps) {
  const { children, className, ...others } = props

  return <NakedButtonChip className={`text-contrast border border-contrast hovered-or-active-or-selected:text-default hovered-or-active-or-selected:border-opposite transition-colors ${className}`}
    {...others}>
    {children}
  </NakedButtonChip>
}

