import { Color } from "@/libs/colors/colors"
import { ClassNameProps } from "@/libs/react/props/className"

export function UserAvatar(props: ClassNameProps & { name: string } & { color: Color }) {
  const { color, name, className } = props

  return <div className={`bg-${color}-400 dark:bg-${color}-500 rounded-full flex justify-center items-center ${className} text-white`}>
    {Array.from(name)[0]}
  </div>
}