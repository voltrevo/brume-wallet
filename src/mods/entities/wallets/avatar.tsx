import { Colors } from "@/libs/colors/bg-color";
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

  return <div className={`${color} rounded-full flex justify-center items-center ${className}`}>
    <WalletIcon modhash={modhash} />
  </div>
}