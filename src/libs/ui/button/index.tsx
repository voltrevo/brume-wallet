import { Color } from "@/libs/colors/colors"
import { ChildrenProps } from "@/libs/react/props/children"
import { ButtonProps } from "@/libs/react/props/html"
import { ButtonGapperDiv, ButtonShrinkerDiv } from "../shrinker"

export function TextButton(props: ButtonProps) {
  const { children, ...rest } = props

  return <button className="inline outline-none hover:underline focus-visible:underline disabled:opacity-50 transition-opacity"
    {...rest}>
    {children}
  </button>
}

export function WideShrinkableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-md bg-opposite text-opposite rounded-xl outline-none whitespace-nowrap enabled:hover:bg-opposite-hover focus-visible:outline-opposite disabled:opacity-50 transition-opacity"
    {...rest}>
    <ButtonShrinkerDiv>
      {children}
    </ButtonShrinkerDiv>
  </button>
}

export function WideShrinkableGradientButton(props: ChildrenProps & ButtonProps & { color: Color }) {
  const { children, color, ...rest } = props

  return <button className={`flex-1 group po-md bg-${color}-400 dark:bg-${color}-500 text-white rounded-xl outline-none whitespace-nowrap enabled:hover:bg-${color}-400/90 focus-visible:outline-${color}-400 dark:enabled:hover:bg-${color}-500/90 dark:focus-visible:outline-${color}-500 disabled:opacity-50 transition-opacity`}
    {...rest}>
    <ButtonShrinkerDiv>
      {children}
    </ButtonShrinkerDiv>
  </button>
}

export function WideShrinkableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-md bg-contrast rounded-xl outline-none whitespace-nowrap enabled:hover:bg-contrast-hover focus-visible:outline-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <ButtonShrinkerDiv>
      {children}
    </ButtonShrinkerDiv>
  </button>
}

export function SmallestOppositeChipButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-xs text-sm bg-opposite text-opposite rounded-full outline-none enabled:hover:bg-opposite-hover focus-visible:outline-opposite disabled:opacity-50 transition-opacity" {...rest}>
    <ButtonGapperDiv>
      {children}
    </ButtonGapperDiv>
  </button>
}

export function SmallShrinkableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-md bg-opposite text-opposite rounded-xl outline-none enabled:hover:bg-opposite-hover focus-visible:outline-opposite disabled:opacity-50 transition-opacity" {...rest}>
    <ButtonShrinkerDiv>
      {children}
    </ButtonShrinkerDiv>
  </button>
}

export function SmallShrinkableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-md bg-contrast rounded-xl outline-none enabled:hover:bg-contrast-hover focus-visible:outline-contrast disabled:opacity-50 transition-opacity" {...rest}>
    <ButtonShrinkerDiv>
      {children}
    </ButtonShrinkerDiv>
  </button>
}

export function WideShrinkableNakedMenuButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-md rounded-xl outline-none whitespace-nowrap enabled:hover:bg-contrast focus-visible:bg-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <div className="h-full w-full flex items-center justify-start gap-4 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function ShrinkableContrastButtonInInputBox(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group px-2 bg-contrast rounded-full outline-none disabled:opacity-50 transition-opacity"
    {...rest}>
    <ButtonShrinkerDiv>
      {children}
    </ButtonShrinkerDiv>
  </button>
}

export function PaddedRoundedShrinkableNakedButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group rounded-full p-2 outline-none enabled:hover:bg-contrast focus-visible:bg-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <ButtonShrinkerDiv>
      {children}
    </ButtonShrinkerDiv>
  </button>
}

export function RoundedShrinkableNakedButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group rounded-full outline-none enabled:hover:bg-contrast focus-visible:bg-contrast disabled:opacity-50 transition-opacity"
    {...rest}>
    <ButtonShrinkerDiv>
      {children}
    </ButtonShrinkerDiv>
  </button>
}