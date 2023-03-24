import { ButtonProps } from '@/libs/react/props/html';
import { OptionalIconProps } from '@/libs/react/props/icon';
import { RefProps } from '@/libs/react/props/ref';

export function ContainedButton(props: ButtonProps & OptionalIconProps & RefProps<HTMLButtonElement>) {
  const { xref, className, children, ...other } = props

  return <button className={`group rounded-xl p-md text-opposite bg-primary border border-primary ahover:text-primary ahover:bg-transparent ahover:dark:bg-transparent ahover:border-secondary transition-colors disabled:opacity-50 ${className}`}
    {...other}
    ref={xref}>
    <div className="flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {props.icon &&
        <props.icon className="icon-xs" />}
      {children}
    </div>
  </button>
}

export function BorderedButton(props: ButtonProps & OptionalIconProps & RefProps<HTMLButtonElement>) {
  const { xref, className, children, ...other } = props

  return <button className={`group rounded-xl p-md text-primary border border-primary ahover:text-secondary ahover:border-secondary transition-colors disabled:opacity-50 ${className}`}
    {...other}
    ref={xref}>
    <div className="flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {props.icon &&
        <props.icon className="icon-xs" />}
      {children}
    </div>
  </button>
}

export function GrowButton(props: ButtonProps & OptionalIconProps & RefProps<HTMLButtonElement>) {
  const { xref, className, children, ...other } = props

  return <button className={`group rounded-xl p-md border border-contrast ahover:scale-105 ahover:border-opposite transition disabled:opacity-50 ${className}`}
    {...other}
    ref={xref}>
    <div className="flex justify-center items-center gap-2">
      {props.icon &&
        <props.icon className="icon-xs" />}
      {children}
    </div>
  </button>
}

export function NakedButton(props: ButtonProps & OptionalIconProps & RefProps<HTMLButtonElement>) {
  const { xref, className, children, ...other } = props

  return <button className={`group rounded-xl p-md text-primary ahover:text-secondary disabled:opacity-50 ${className}`}
    {...other}
    ref={xref}>
    <div className="flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {props.icon &&
        <props.icon className="icon-xs" />}
      {children}
    </div>
  </button>
}