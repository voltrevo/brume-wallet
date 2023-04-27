/* eslint-disable @next/next/no-img-element */
import { BigInts } from "@/libs/bigints/bigints";
import { Colors } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { useBooleanState } from "@/libs/react/handles/boolean";
import { useEthereumSession } from "@/libs/tor/sessions/session";
import { useSessions } from "@/mods/tor/sessions/context";
import { Query } from "@hazae41/xswr";
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

function useFloat(query: Query<bigint>) {
  return useMemo(() => {
    if (query.error !== undefined)
      return "Error"
    if (query.data === undefined)
      return "..."
    return BigInts.float(query.data, 18)
  }, [query.data, query.error])
}

function WalletDataPage(props: WalletDataProps) {
  const { wallet } = props

  const router = useRouter()
  const sessions = useSessions()

  const mainnet = useEthereumSession(wallet.uuid, sessions)?.[1]
  const goerli = useEthereumSession(wallet.uuid, sessions)?.[5]

  const color = Colors.get(wallet.color)
  const color2 = Colors.get(wallet.color + 1)

  const mainnetBalance = useBalance(wallet.address, mainnet)
  const mainnetBalanceFloat = useFloat(mainnetBalance)
  const mainnetSendDialog = useBooleanState()

  const goerliBalance = useBalance(wallet.address, goerli)
  const goerliBalanceFloat = useFloat(goerliBalance)
  const goerliSendDialog = useBooleanState()

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
          onClick={mainnetSendDialog.enable}>
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
    {mainnetSendDialog.current && mainnet &&
      <SendDialog title="(mainnet)"
        wallet={wallet}
        session={mainnet}
        close={mainnetSendDialog.disable} />}
    {goerliSendDialog.current && goerli &&
      <SendDialog title="(Goerli testnet)"
        wallet={wallet}
        session={goerli}
        close={goerliSendDialog.disable} />}
    {Navbar}
    {Card}
    {Apps}
    <div className="p-xmd flex flex-col gap-2">
      <button className="w-full p-xmd flex flex-col rounded-xl border border-contrast"
        onClick={mainnetSendDialog.enable}>
        <div className="w-full flex justify-between items-center">
          <div className="">
            Ethereum (mainnet)
          </div>
          <div className="">
            $???
          </div>
        </div>
        <div className="text-contrast">
          {`${mainnetBalanceFloat} ETH`}
        </div>
      </button>
      <button className="w-full p-xmd flex flex-col rounded-xl border border-contrast"
        onClick={goerliSendDialog.enable}>
        <div className="w-full flex justify-between items-center">
          <div className="">
            Ethereum (Goerli testnet)
          </div>
          <div className="">
            $0.0
          </div>
        </div>
        <div className="text-contrast">
          {`${goerliBalanceFloat} ETH`}
        </div>
      </button>
    </div>
  </div>
}
