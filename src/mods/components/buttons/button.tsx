import { Colors } from "@/libs/colors/colors";
import { ButtonProps } from '@/libs/react/props/html';
import { OptionalIconProps } from '@/libs/react/props/icon';
import { RefProps } from '@/libs/react/props/ref';

export function GradientButton(props: ButtonProps & RefProps<HTMLButtonElement> & OptionalIconProps & { colorIndex: number }) {
  const { xref, className, icon: Icon, children, colorIndex, ...other } = props

  const color1 = Colors.get(colorIndex)
  const color2 = Colors.get(colorIndex + 1)

  return <button className={`group rounded-xl p-md text-opposite ahover:text-${color1} border border-${color1} bg-gradient-to-r from-${color1} to-${color2} ahover:bg-none transition-colors disabled:opacity-50 ${className}`}
    {...other}
    ref={xref}>
    <div className="flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {Icon &&
        <Icon className="icon-xs" />}
      {children}
    </div>
  </button>
}