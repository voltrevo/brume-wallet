import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { ClassNameProps } from "@/libs/react/props/className";

export function WalletIcon(props: ClassNameProps & { modhash: number }) {
  const { modhash, className } = props

  const emoji = Emojis.get(modhash)

  return <span className={className}>
    {emoji}
  </span>
}

export function WalletAvatar(props: ClassNameProps & { modhash: number }) {
  const { modhash, className } = props

  const color = Colors.get(modhash)
  const color2 = Colors.get(modhash + 1)

  return <div className={`bg-gradient-to-br from-${color} to-${color2} rounded-full flex justify-center items-center ${className}`}>
    <WalletIcon modhash={modhash} />
  </div>
}