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