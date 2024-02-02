import { Color, Gradient, Gradients } from "@/libs/colors/colors";
import { ClassNameProps } from "@/libs/react/props/className";
import { ColorIndexProps } from "@/libs/react/props/color";
import { EmojiProps } from "@/libs/react/props/emoji";

export function WalletAvatar2(props: ClassNameProps & EmojiProps & { color: Color }) {
  const { color, emoji, className } = props

  const [color1, color2] = Gradient.get(color)

  return <div className={`bg-gradient-to-br from-${color1}-400 to-${color2}-400 dark:from-${color1}-500 dark:to-${color2}-500 rounded-full flex justify-center items-center ${className}`}>
    {emoji}
  </div>
}

export function WalletAvatar(props: ClassNameProps & ColorIndexProps & EmojiProps) {
  const { colorIndex: color, emoji, className } = props

  const [color1, color2] = Gradients.get(color)

  return <div className={`bg-gradient-to-br from-${color1} to-${color2} rounded-full flex justify-center items-center ${className}`}>
    {emoji}
  </div>
}