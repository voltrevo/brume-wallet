import { Colors } from "@/libs/colors/colors";
import { ButtonProps } from '@/libs/react/props/html';
import { OptionalIconProps } from '@/libs/react/props/icon';
import { RefProps } from '@/libs/react/props/ref';

export function GradientButton(props: ButtonProps & OptionalIconProps & RefProps<HTMLButtonElement> & { modhash: number }) {
  const { xref, className, icon: Icon, children, modhash, ...other } = props

  const color = Colors.get(modhash)
  const color2 = Colors.get(modhash + 1)

  return <button className={`group rounded-xl p-md text-opposite ahover:text-${color} border border-${color} bg-gradient-to-r from-${color} to-${color2} ahover:bg-none transition-colors disabled:opacity-50 ${className}`}
    {...other}
    ref={xref}>
    <div className="flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {Icon &&
        <Icon className="icon-xs" />}
      {children}
    </div>
  </button>
}