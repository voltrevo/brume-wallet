import { Colors } from "@/libs/colors/colors";
import { ColorIndexProps } from "@/libs/react/props/color";
import { ButtonProps } from '@/libs/react/props/html';
import { OptionalIconProps } from '@/libs/react/props/icon';
import { ButtonInner } from "./chips";

export function GradientButton(props: ButtonProps & OptionalIconProps & ColorIndexProps) {
  const { className, icon, children, colorIndex, ...button } = props

  const color1 = Colors.get(colorIndex)
  const color2 = Colors.get(colorIndex + 1)

  return <button className={`group rounded-xl p-md text-opposite ahover:text-${color1} border border-${color1} bg-gradient-to-r from-${color1} to-${color2} ahover:bg-none transition-colors disabled:opacity-50 ${className}`}
    {...button}>
    <ButtonInner icon={icon}>
      {children}
    </ButtonInner>
  </button>
}