/* eslint-disable @next/next/no-img-element */
import { BigInts } from "@/libs/bigints/bigints";
import { Colors } from "@/libs/colors/bg-color";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useBooleanState } from "@/libs/react/handles/boolean";
import { useSessions } from "@/mods/tor/sessions/context";
import { useRouter } from "next/router";
import { useBalance, useWallet } from "./data";
import { WalletRow } from "./row";
import { SendDialog } from "./send";

export function WalletPage(props: { uuid: string }) {
  const { uuid } = props

  const router = useRouter()
  const sessions = useSessions()

  const wallet = useWallet(uuid)

  const modhash = useModhash(uuid)
  const color = Colors.get(modhash)

  const balance = useBalance(wallet.data?.ethereumAddress, sessions)

  const fbalance = (() => {
    if (balance.error !== undefined)
      return "Error"
    if (balance.data === undefined)
      return "..."
    return BigInts.float(balance.data, 18)
  })()

  const sendDialog = useBooleanState()

  if (!wallet.data) return null

  const Headbar =
    <div className="p-xmd w-full flex items-center">
      <button className="p-1 bg-ahover rounded-xl"
        onClick={router.back}>
        <Outline.ChevronLeftIcon className="icon-sm" />
      </button>
    </div>

  const Card =
    <div className="p-xmd flex justify-center">
      <WalletRow
        wallet={wallet.data} />
    </div>

  const Body =
    <div className="p-xmd flex items-center justify-center flex-wrap gap-12">
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white ${color} rounded-xl p-3 ahover:scale-105 transition-transform`}
          onClick={sendDialog.enable}>
          <Outline.PaperAirplaneIcon className="icon-md" />
        </button>
        <div className="">
          {`Send`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white ${color} rounded-xl p-3 ahover:scale-105 transition-transform`}>
          <Outline.QrCodeIcon className="icon-md" />
        </button>
        <div className="">
          {`Receive`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white ${color} rounded-xl p-3 ahover:scale-105 transition-transform`}>
          <Outline.ArrowsRightLeftIcon className="icon-md" />
        </button>
        <div className="">
          {`Swap`}
        </div>
      </div>
    </div>

  return <div className="h-full w-full flex flex-col">
    {sendDialog.current &&
      <SendDialog
        wallet={wallet.data}
        close={sendDialog.disable} />}
    {Headbar}
    {Card}
    {Body}
    <div className="p-xmd flex flex-col items-center">
      <div className="text-contrast">
        {`${fbalance} Goerli ETH`}
      </div>
    </div>
  </div>
}
