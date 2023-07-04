import { Outline } from "@/libs/icons/icons"
import { ButtonProps } from "@/libs/react/props/html"
import { InnerButton, NakedButton } from "./naked"

export default function Page() {
  return <div className="p-1">
    <ContrastButton>
      <InnerButton icon={Outline.GlobeAltIcon}>
        Hello world
      </InnerButton>
    </ContrastButton>
    <div className="h-1" />
    <ContrastButton>
      <InnerButton>
        Hello world
      </InnerButton>
    </ContrastButton>
  </div>
}

export function ContrastButton(props: ButtonProps) {
  const { className, children, ...button } = props

  return <NakedButton className={`rounded-xl p-md text-contrast border border-contrast hovered-or-active-or-selected:text-default hovered-or-active-or-selected:border-opposite transition-colors ${className}`}
    {...button}>
    {children}
  </NakedButton>
}