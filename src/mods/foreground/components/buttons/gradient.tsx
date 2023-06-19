import { Colors } from "@/libs/colors/colors";
import { ColorIndexProps } from "@/libs/react/props/color";
import { ButtonProps } from '@/libs/react/props/html';
import { NakedButton } from "./button";

export function GradientButton(props: ButtonProps & ColorIndexProps) {
  const { className, children, colorIndex, ...button } = props

  const color1 = Colors.get(colorIndex)
  const color2 = Colors.get(colorIndex + 1)

  return <NakedButton className={`rounded-xl p-md text-opposite hovered-or-active-or-selected:text-${color1} border border-${color1} bg-gradient-to-r from-${color1} to-${color2} hovered-or-active-or-selected:bg-none transition-colors ${className}`}
    {...button}>
    {children}
  </NakedButton>
}