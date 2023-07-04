import { Outline } from "@/libs/icons/icons"
import { ButtonProps } from "@/libs/react/props/html"
import { InnerButton, NakedButton } from "./naked"

export default function Page() {
  return <ContrastButton>
    <InnerButton icon={Outline.GlobeAltIcon}>
      Hello world
    </InnerButton>
  </ContrastButton>
}

export function ContrastButton(props: ButtonProps) {
  const { className, children, ...button } = props

  return <NakedButton className={`rounded-xl p-md text-contrast border border-contrast hovered-or-active-or-selected:text-default hovered-or-active-or-selected:border-opposite transition-colors ${className}`}
    {...button}>
    {children}
  </NakedButton>
}