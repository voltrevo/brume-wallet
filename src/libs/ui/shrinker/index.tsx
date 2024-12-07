import { ChildrenProps } from "@/libs/react/props/children"

export function GapperDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full w-full flex justify-center items-center gap-2">
    {children}
  </div>
}

export function GapperAndClickerInButtonDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full w-full flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform">
    {children}
  </div>
}

export function GapperAndClickerInAnchorDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full w-full flex justify-center items-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
    {children}
  </div>
}

export function ClickerInAnchorDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full w-full group-active:scale-90 transition-transform">
    {children}
  </div>
}