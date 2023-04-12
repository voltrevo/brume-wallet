import { Colors } from "@/libs/colors/bg-color";
import { Emojis } from "@/libs/emojis/emojis";
import { useModhash } from "@/libs/modhash/modhash";
import { ClassNameProps } from "@/libs/react/props/className";

export function WalletIcon(props: ClassNameProps & { uuid: string }) {
  const { uuid, className } = props

  const modhash = useModhash(uuid)
  const emoji = Emojis.get(modhash)

  return <span className={className}>
    {emoji}
  </span>
}

export function WalletAvatar(props: ClassNameProps & { uuid: string }) {
  const { uuid, className } = props

  const modhash = useModhash(uuid)
  const color = Colors.get(modhash)

  return <div className={`${color} rounded-full flex justify-center items-center ${className}`}>
    <WalletIcon uuid={uuid} />
  </div>
}