import { useColor } from "@/libs/colors/color";
import { ClassNameProps } from "@/libs/react/props/className";

export function WalletIcon(props: ClassNameProps) {
  const { className } = props

  return <span className={className}>{`☁️`}</span>
}

export function WalletAvatar(props: ClassNameProps & {
  address?: string
}) {
  const { address, className } = props

  const color = useColor(address)

  return <div className={`bg-${color} rounded-full flex justify-center items-center ${className}`}>
    <WalletIcon />
  </div>
}