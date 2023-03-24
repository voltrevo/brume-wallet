import { useColor } from "@/libs/colors/color";

export function WalletAvatar(props: {
  address?: string,
  size: number,
  textSize: number
}) {
  const { address, size, textSize } = props

  const color = useColor(address)

  return <div className={`${color} rounded-full flex justify-center items-center`}
    style={{ fontSize: `${textSize}rem`, height: `${size}rem`, width: `${size}rem` }}>
    {`☁️`}
  </div>
}