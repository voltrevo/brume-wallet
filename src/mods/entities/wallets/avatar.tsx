import { Colors } from "@/libs/colors/colors";
import { ClassNameProps } from "@/libs/react/props/className";

export function WalletIcon(props: ClassNameProps & {
  emoji: string
}) {
  const { emoji, className } = props

  return <span className={className}>
    {emoji}
  </span>
}

export function WalletAvatar(props: ClassNameProps & {
  color: number,
  emoji: string
}) {
  const { color, emoji, className } = props

  const color1 = Colors.get(color)
  const color2 = Colors.get(color + 1)

  return <div className={`bg-gradient-to-br from-${color1} to-${color2} rounded-full flex justify-center items-center ${className}`}>
    <WalletIcon className=""
      emoji={emoji} />
  </div>
}