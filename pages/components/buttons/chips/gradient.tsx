import { Colors } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { ColorIndexProps } from "@/libs/react/props/color";
import { ButtonProps } from "@/libs/react/props/html";
import { InnerChip, NakedChip } from "./naked";

export default function Page() {
  return <div className="p-1">
    <GradientChip colorIndex={5}>
      <InnerChip icon={Outline.GlobeAltIcon}>
        Hello world
      </InnerChip>
    </GradientChip>
    <div className="h-1" />
    <GradientChip colorIndex={5}>
      <InnerChip>
        Hello world
      </InnerChip>
    </GradientChip>
  </div>
}

export function GradientChip(props: ButtonProps & ColorIndexProps) {
  const { colorIndex, className, children, ...button } = props

  const color1 = Colors.get(colorIndex)
  const color2 = Colors.get(colorIndex + 1)

  return <NakedChip className={`text-opposite hovered-or-active-or-selected:text-${color1} border border-${color1} bg-gradient-to-r from-${color1} to-${color2} hovered-or-active-or-selected:bg-none transition-colors ${className}`}
    {...button}>
    {children}
  </NakedChip>
}