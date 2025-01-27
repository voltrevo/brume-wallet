import { Color } from "@/libs/colors/colors"
import { ChildrenProps } from "@/libs/react/props/children"
import { ButtonProps } from "@/libs/react/props/html"
import { GapperAndClickerInButtonDiv } from "../shrinker"

export function TextButton(props: ButtonProps) {
  const { children, ...rest } = props

  return <button className="inline outline-none hover:underline focus-visible:underline disabled:opacity-50 transition-opacity"
    {...rest}>
    {children}
  </button>
}

export function WideClickableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-2 bg-opposite text-opposite rounded-xl outline-none whitespace-nowrap enabled:hover:bg-opposite-double-contrast focus-visible:outline-opposite disabled:opacity-50 transition-opacity"
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}

export function WideClickableGradientButton(props: ChildrenProps & ButtonProps & { color: Color }) {
  const { children, color, ...rest } = props

  return <button className={`flex-1 group po-2 bg-${color}-400 dark:bg-${color}-500 text-white rounded-xl outline-none whitespace-nowrap enabled:hover:bg-${color}-400/90 focus-visible:outline-${color}-400 dark:enabled:hover:bg-${color}-500/90 dark:focus-visible:outline-${color}-500 disabled:opacity-50 transition-opacity`}
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}

export function WideClickableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-2 bg-default-contrast rounded-xl outline-none whitespace-nowrap enabled:hover:bg-default-double-contrast focus-visible:outline-default-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}

export function SmallAndRoundedClickableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-0.5 text-sm bg-opposite text-opposite rounded-full outline-none enabled:hover:bg-opposite-double-contrast focus-visible:outline-opposite disabled:opacity-50 transition-opacity"
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}

export function ClickableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-2 bg-opposite text-opposite rounded-xl outline-none enabled:hover:bg-opposite-double-contrast focus-visible:outline-opposite disabled:opacity-50 transition-opacity"
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}

export function ClickableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-2 bg-default-contrast rounded-xl outline-none enabled:hover:bg-default-double-contrast focus-visible:outline-default-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}

export function WideClickableNakedMenuButton(props: ChildrenProps & ButtonProps & { ["data-value"]?: string } & { ["aria-selected"]?: boolean }) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-2 rounded-xl outline-none whitespace-nowrap enabled:hover:bg-default-contrast focus-visible:bg-default-contrast aria-selected:bg-default-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <div className="h-full w-full flex items-center justify-start gap-4 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function ClickableContrastButtonInInputBox(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group px-2 bg-default-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}

export function PaddedRoundedClickableNakedButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group rounded-full p-2 outline-none enabled:hover:bg-default-contrast focus-visible:bg-default-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}

export function RoundedClickableNakedButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group rounded-full outline-none enabled:hover:bg-default-contrast focus-visible:bg-default-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}