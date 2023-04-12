import { Colors } from "@/libs/colors/bg-color";
import { useTryModhash } from "@/libs/modhash/modhash";
import { ClassNameProps } from "@/libs/react/props/className";

export function WalletIcon(props: ClassNameProps) {
  const { className } = props

  return <span className={className}>{`☁️`}</span>
}

export function WalletAvatar(props: ClassNameProps & { address?: string }) {
  const { address, className } = props

  const modhash = useTryModhash(address)

  const color = modhash
    ? Colors.get(modhash)
    : "bg-contrast"

  return <div className={`${color} rounded-full flex justify-center items-center ${className}`}>
    <WalletIcon />
  </div>
}