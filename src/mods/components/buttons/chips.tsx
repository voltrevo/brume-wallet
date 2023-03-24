import { Icon } from "@/libs/react/icon"
import { ButtonProps } from "@/libs/react/props/html"

export function ButtonChip(props: ButtonProps & { icon: Icon }) {
  const { icon: Icon, children, ...others } = props

  return <button className="group p-sm rounded-full text-primary border border-primary ahover:text-secondary ahover:border-secondary transition-colors"
    {...others}>
    <div className={`flex items-center gap-2 group-active:${children ? "scale-90" : "scale-75"} transition-transform`}>
      <Icon className="icon-xs my-1" />
      {children && <div className="shrink-0">{children}</div>}
    </div>
  </button>
}