/* eslint-disable @next/next/no-img-element */
import { BigInts } from "@/libs/bigints/bigints";
import { Colors } from "@/libs/colors/colors";
import { chains } from "@/libs/ethereum/chain";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Query } from "@hazae41/xswr";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { PageHeader } from "../../components/page/header";
import { Page } from "../../components/page/page";
import { WalletDataProvider, useWalletData } from "./context";
import { useBalance, useEthereumHandle } from "./data";
import { WalletDataCard } from "./row";
import { WalletDataSendDialog } from "./send";

export function WalletPage(props: UUIDProps) {
  const { uuid } = props

  return <WalletDataProvider uuid={uuid}>
    <WalletDataPage />
  </WalletDataProvider>
}

function useFloat<K, D extends bigint, F>(query: Query<K, D, F>) {
  return useMemo(() => {
    if (query.error !== undefined)
      return "Error"
    if (query.data === undefined)
      return "..."
    return BigInts.float(query.data.inner, 18)
  }, [query.data, query.error])
}

function WalletDataPage() {
  const wallet = useWalletData()

  const router = useRouter()

  const mainnet = useEthereumHandle(wallet, chains[1])
  const goerli = useEthereumHandle(wallet, chains[5])
  const polygon = useEthereumHandle(wallet, chains[137])

  const color = Colors.get(wallet.color)
  const color2 = Colors.get(wallet.color + 1)

  const mainnetBalance = useBalance(wallet.address, mainnet)
  const mainnetBalanceFloat = useFloat(mainnetBalance)
  const mainnetSendDialog = useBooleanHandle(false)

  const goerliBalance = useBalance(wallet.address, goerli)
  const goerliBalanceFloat = useFloat(goerliBalance)
  const goerliSendDialog = useBooleanHandle(false)

  const polygonBalance = useBalance(wallet.address, polygon)
  const polygonBalanceFloat = useFloat(polygonBalance)
  const polygonSendDialog = useBooleanHandle(false)

  const Header =
    <PageHeader
      title="Wallet"
      back={router.back} />

  const Card =
    <div className="p-xmd flex justify-center">
      <div className="w-full max-w-sm">
        <WalletDataCard />
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

  return <Page>
    {mainnetSendDialog.current && mainnet &&
      <WalletDataSendDialog title="(Ethereum mainnet)"
        handle={mainnet}
        close={mainnetSendDialog.disable} />}
    {goerliSendDialog.current && goerli &&
      <WalletDataSendDialog title="(Goerli testnet)"
        handle={goerli}
        close={goerliSendDialog.disable} />}
    {polygonSendDialog.current && polygon &&
      <WalletDataSendDialog title="(Polygon mainnet)"
        handle={polygon}
        close={polygonSendDialog.disable} />}
    {Header}
    {Card}
    {Apps}
    <div className="p-xmd flex flex-col gap-2">
      <button className="w-full p-xmd flex flex-col rounded-xl border border-contrast"
        onClick={mainnetSendDialog.enable}>
        <div className="w-full flex justify-between items-center">
          <div className="">
            Ethereum (Ethereum mainnet)
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
      <button className="w-full p-xmd flex flex-col rounded-xl border border-contrast"
        onClick={polygonSendDialog.enable}>
        <div className="w-full flex justify-between items-center">
          <div className="">
            Matic (Polygon mainnet)
          </div>
          <div className="">
            $???
          </div>
        </div>
        <div className="text-contrast">
          {`${polygonBalanceFloat} MATIC`}
        </div>
      </button>
    </div>
  </Page>
}
