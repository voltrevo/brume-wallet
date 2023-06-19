import { ClassNameProps } from "@/libs/react/props/className"
import { ButtonProps } from "@/libs/react/props/html"
import { NakedButtonChip } from "./naked"

export function ContrastButtonChip(props: ButtonProps & ClassNameProps) {
  const { children, className, ...others } = props

  return <NakedButtonChip className={`text-contrast border border-contrast hovered-or-active-or-selected:text-default hovered-or-active-or-selected:border-opposite transition-colors ${className}`}
    {...others}>
    {children}
  </NakedButtonChip>
}

