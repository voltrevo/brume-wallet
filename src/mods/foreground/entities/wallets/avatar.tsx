import { Gradients } from "@/libs/colors/colors";
import { ClassNameProps } from "@/libs/react/props/className";
import { ColorIndexProps } from "@/libs/react/props/color";
import { EmojiProps } from "@/libs/react/props/emoji";

export function WalletIcon(props: ClassNameProps & EmojiProps) {
  const { emoji, className } = props

  return <span className={className}>
    {emoji}
  </span>
}

export function WalletAvatar(props: ClassNameProps & ColorIndexProps & EmojiProps) {
  const { colorIndex: color, emoji, className } = props

  const [color1, color2] = Gradients.get(color)

  return <div className={`bg-gradient-to-br from-${color1} to-${color2} rounded-full flex justify-center items-center ${className}`}>
    <WalletIcon className=""
      emoji={emoji} />
  </div>
}