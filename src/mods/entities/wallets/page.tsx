/* eslint-disable @next/next/no-img-element */
import { BigInts } from "@/libs/bigints/bigints";
import { Colors } from "@/libs/colors/bg-color";
import { useCopy } from "@/libs/copy/copy";
import { Outline } from "@/libs/icons/icons";
import { HoverPopper } from "@/libs/modals/popper";
import { useModhash } from "@/libs/modhash/modhash";
import { useBooleanState } from "@/libs/react/handles/boolean";
import { useElement } from "@/libs/react/handles/element";
import { useSessions } from "@/mods/tor/sessions/context";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { WalletAvatar } from "./avatar";
import { useBalance, useWallet } from "./data";
import { SendDialog } from "./send";

export function WalletPage(props: { address: string }) {
  const { address } = props

  const router = useRouter()
  const sessions = useSessions()

  const wallet = useWallet(address)

  const modhash = useModhash(address)
  const color = Colors.get(modhash)

  const balance = useBalance(address, sessions)

  const fbalance = (() => {
    if (balance.error !== undefined)
      return "Error"
    if (balance.data === undefined)
      return "..."
    return BigInts.float(balance.data, 18)
  })()

  const copyPopper = useElement()
  const copyRunner = useCopy(address)

  const WalletInfo =
    <div className="p-xmd flex flex-col items-center">
      <WalletAvatar className="icon-7xl text-4xl"
        address={address} />
      <div className="h-2" />
      <div className="text-xl font-medium max-w-[200px] truncate">
        {wallet.data?.name}
      </div>
      <button className="text-contrast"
        onClick={copyRunner.run}
        onMouseEnter={copyPopper.use}
        onMouseLeave={copyPopper.unset}>
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
      </button>
      <div className="text-contrast">
        {`${fbalance} Goerli ETH`}
      </div>
      <HoverPopper target={copyPopper}>
        {copyRunner.current
          ? `Copied ✅`
          : `Copy address`}
      </HoverPopper>
    </div>

  const Toolbar =
    <div className="p-xmd w-full flex items-center">
      <button className="p-1 bg-ahover rounded-xl"
        onClick={router.back}>
        <ArrowLeftIcon className="icon-sm" />
      </button>
    </div>

  const sendDialog = useBooleanState()

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

  if (!wallet.data) return null

  return <div className="h-full w-full flex flex-col">
    {sendDialog.current &&
      <SendDialog
        wallet={wallet.data}
        close={sendDialog.disable} />}
    {Toolbar}
    {WalletInfo}
    {Body}
  </div>
}
