/* eslint-disable @next/next/no-img-element */
import { BigInts } from "@/libs/bigints/bigints";
import { Colors } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { useBooleanState } from "@/libs/react/handles/boolean";
import { useSession, useSessions } from "@/mods/tor/sessions/context";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { WalletDataProps, useBalance, useWallet } from "./data";
import { WalletCard } from "./row";
import { SendDialog } from "./send";

export function WalletPage(props: { uuid: string }) {
  const { uuid } = props

  const wallet = useWallet(uuid)

  if (!wallet.data) return null

  return <WalletDataPage wallet={wallet.data} />
}

function WalletDataPage(props: WalletDataProps) {
  const { wallet } = props

  const router = useRouter()
  const sessions = useSessions()

  const session = useSession(wallet.uuid, sessions)

  const color = Colors.get(wallet.modhash)
  const color2 = Colors.get(wallet.modhash + 1)

  const balance = useBalance(wallet.ethereumAddress, session)

  const balanceFloat = useMemo(() => {
    if (balance.error !== undefined)
      return "Error"
    if (balance.data === undefined)
      return "..."
    return BigInts.float(balance.data, 18)
  }, [balance.data, balance.error])

  const sendDialog = useBooleanState()

  const Navbar =
    <div className="p-xmd w-full flex items-center">
      <button className="p-1 bg-ahover rounded-xl"
        onClick={router.back}>
        <Outline.ChevronLeftIcon className="icon-sm" />
      </button>
    </div>

  const Card =
    <div className="p-xmd flex justify-center">
      <div className="w-full max-w-sm">
        <WalletCard
          wallet={wallet} />
      </div>
    </div>

  const Apps =
    <div className="p-xmd flex items-center justify-center flex-wrap gap-12">
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 ahover:scale-105 transition-transform`}
          onClick={sendDialog.enable}>
          <Outline.PaperAirplaneIcon className="icon-md" />
        </button>
        <div className="">
          {`Send`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 ahover:scale-105 transition-transform`}>
          <Outline.QrCodeIcon className="icon-md" />
        </button>
        <div className="">
          {`Receive`}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className={`text-white bg-gradient-to-r from-${color} to-${color2} rounded-xl p-3 ahover:scale-105 transition-transform`}>
          <Outline.ArrowsRightLeftIcon className="icon-md" />
        </button>
        <div className="">
          {`Swap`}
        </div>
      </div>
    </div>

  return <div className="h-full w-full flex flex-col">
    {sendDialog.current && session &&
      <SendDialog
        wallet={wallet}
        session={session}
        close={sendDialog.disable} />}
    {Navbar}
    {Card}
    {Apps}
    <div className="p-xmd flex flex-col gap-2">
      <div className="p-xmd flex flex-col rounded-xl border border-contrast">
        <div className="flex justify-between items-center">
          <div className="">
            Bitcoin (unimplemented)
          </div>
          <div className="">
            $0.0
          </div>
        </div>
        <div className="text-contrast">
          {`0 BTC`}
        </div>
      </div>
      <div className="p-xmd flex flex-col rounded-xl border border-contrast">
        <div className="flex justify-between items-center">
          <div className="">
            Ethereum (Goerli testnet)
          </div>
          <div className="">
            $0.0
          </div>
        </div>
        <div className="text-contrast">
          {`${balanceFloat} ETH`}
        </div>
      </div>
    </div>
  </div>
}
