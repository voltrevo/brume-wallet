import { ChildrenProps } from "@/libs/react/props/children";
import { AnchorProps } from "@/libs/react/props/html";
import { Booleanish } from "@/libs/types/boolean";
import { GapperAndClickerInAnchorDiv } from "../shrinker";

export function ColoredTextAnchor(props: AnchorProps & { "aria-disabled"?: Booleanish }) {
  const { href, children = href, target = "_blank", rel = "noreferrer", ...rest } = props

  return <a className="text-colored outline-none hover:underline focus-visible:underline aria-disabled:opacity-50 transition-opacity"
    href={href}
    target={target}
    rel={rel}
    {...rest}>
    {children}
  </a>
}

export function TextAnchor(props: AnchorProps & { "aria-disabled"?: Booleanish }) {
  const { href, children = href, target = "_blank", rel = "noreferrer", "aria-disabled": disabled = false, ...rest } = props

  return <a className="outline-none hover:underline focus-visible:underline aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    target={target}
    href={href}
    rel={rel}
    {...rest}>
    {children}
  </a>
}

export function ClickableOppositeAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: Booleanish }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="group po-md bg-opposite text-opposite rounded-xl outline-none aria-[disabled=false]:hover:bg-opposite-hover focus-visible:outline-opposite aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}

export function ClickableContrastAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: Booleanish }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="group po-md bg-contrast rounded-xl outline-none aria-[disabled=false]:hover:bg-contrast-hover focus-visible:outline-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}

export function WideClickableOppositeAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: Booleanish }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="flex-1 group po-md bg-opposite border border-opposite text-opposite rounded-xl outline-none whitespace-nowrap aria-[disabled=false]:hover:bg-opposite-hover focus-visible:outline-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}

export function WideClickableContrastAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: Booleanish }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="flex-1 group po-md bg-contrast rounded-xl outline-none whitespace-nowrap aria-[disabled=false]:hover:bg-contrast-hover focus-visible:outline-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}

export function WideClickableNakedMenuAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: Booleanish }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="flex-1 group po-md rounded-xl outline-none whitespace-nowrap aria-[disabled=false]:hover:bg-contrast focus-visible:bg-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <div className="h-full w-full flex items-center justify-start gap-4 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
      {children}
    </div>
  </a>
}

export function PaddedRoundedClickableNakedAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: Booleanish }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="group rounded-full p-2 outline-none aria-[disabled=false]:hover:bg-contrast focus-visible:bg-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}

export function RoundedClickableNakedAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: Booleanish }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="group rounded-full outline-none aria-[disabled=false]:hover:bg-contrast focus-visible:bg-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}