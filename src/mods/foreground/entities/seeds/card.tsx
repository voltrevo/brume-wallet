import { Color, Gradient } from "@/libs/colors/colors"
import { Outline } from "@/libs/icons/icons"
import { WalletIcon } from "../wallets/avatar"
import { CircularWhiteButtonInColoredCard } from "../wallets/card"
import { useSeedDataContext } from "./context"

export function SeedDataCard(props: { ok?: () => void }) {
  const seed = useSeedDataContext()
  const { ok } = props

  const color = Color.get(seed.color)
  const [color1, color2] = Gradient.get(color)

  const First =
    <div className="flex items-center">
      <div className="shrink-0">
        <WalletIcon className="text-xl"
          emoji={seed.emoji} />
      </div>
      <div className="w-2 grow" />
      {ok != null &&
        <CircularWhiteButtonInColoredCard
          color={color}
          onClick={ok}>
          <Outline.EllipsisHorizontalIcon className="size-5" />
        </CircularWhiteButtonInColoredCard>}
    </div>

  const Name =
    <div className="flex items-center text-white font-medium">
      <div className="truncate">
        {seed.name}
      </div>
    </div>

  return <div className={`po-md w-full aspect-video rounded-xl flex flex-col text-white bg-gradient-to-br from-${color1}-400 to-${color2}-400 dark:from-${color1}-500 dark:to-${color2}-500`}>
    {First}
    <div className="grow" />
    {Name}
  </div>
}
