import { Colors } from "@/libs/colors/color";
import { useMemo } from "react";

export function WalletAvatar(props: {
  address?: string,
  size: number,
  textSize: number
}) {
  const { address, size, textSize } = props

  const color = useMemo(() => {
    if (!address) return "bg-contrast"

    return Colors.from(address)
  }, [address])

  return <div className={`${color} rounded-full flex justify-center items-center`}
    style={{ fontSize: `${textSize}rem`, height: `${size}rem`, width: `${size}rem` }}>
    {`☁️`}
  </div>
}