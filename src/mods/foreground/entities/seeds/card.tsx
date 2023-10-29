import { Gradients } from "@/libs/colors/colors"
import { Outline } from "@/libs/icons/icons"
import { Button } from "@/libs/ui/button"
import { WalletIcon } from "../wallets/avatar"
import { useSeedDataContext } from "./context"

export function SeedDataCard() {
  const seed = useSeedDataContext()

  const [color, color2] = Gradients.get(seed.color)

  const First =
    <div className="flex items-center">
      <div className="shrink-0">
        <WalletIcon className="text-xl"
          emoji={seed.emoji} />
      </div>
      <div className="w-2 grow" />
      <Button.White className={`text-${color}`}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.EllipsisHorizontalIcon className="s-sm" />
        </div>
      </Button.White>
    </div>

  const Name =
    <div className="flex items-center text-white font-medium">
      <div className="truncate">
        {seed.name}
      </div>
    </div>

  return <div className={`po-md w-full aspect-video rounded-xl flex flex-col text-white bg-gradient-to-br from-${color} to-${color2}`}>
    {First}
    <div className="grow" />
    {Name}
  </div>
}
