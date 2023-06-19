import { Colors } from "@/libs/colors/colors";
import { ChildrenProps } from "@/libs/react/props/children";
import { ClassNameProps } from "@/libs/react/props/className";
import { ColorIndexProps } from "@/libs/react/props/color";
import { ButtonProps } from '@/libs/react/props/html';
import { OptionalIconProps } from '@/libs/react/props/icon';

export function GradientButton(props: ButtonProps & OptionalIconProps & ColorIndexProps) {
  const { className, icon, children, colorIndex, ...button } = props

  const color1 = Colors.get(colorIndex)
  const color2 = Colors.get(colorIndex + 1)

  return <NakedButton className={`rounded-xl p-md text-opposite hovered-or-active-or-selected:text-${color1} border border-${color1} bg-gradient-to-r from-${color1} to-${color2} hovered-or-active-or-selected:bg-none transition-colors ${className}`}
    {...button}>
    <ButtonChildren icon={icon}>
      {children}
    </ButtonChildren>
  </NakedButton>
}

export function NakedButton(props: ButtonProps) {
  const { className, children, ...button } = props

  return <button className={`group disabled:opacity-50 ${className}`}
    {...button}>
    {children}
  </button>
}

export function ButtonChildren(props: OptionalIconProps & ChildrenProps & ClassNameProps) {
  const { icon: Icon, children, className } = props

  return <div className={`flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform ${className}`}>
    {Icon && <Icon className="icon-sm" />}
    {children}
  </div>
}
