import { useBoolean } from "@/libs/react/handles/boolean"
import { OkProps } from "@/libs/react/props/promise"
import { ContrastTextButton, OppositeTextButton } from "@/mods/components/button"
import { ShieldCheckIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/router"
import { useCallback } from "react"
import { NetworkSelectionDialog } from '../../../components/dialogs/networks'
import { Wallet, WalletProps } from "../data"
import { WalletRow } from "../row"
import { WalletCreatorDialog } from "./create"
import { useWallets } from "./data"

export function WalletsPage(props: {}) {
  const router = useRouter()
  const wallets = useWallets()
  const creator = useBoolean()

  const onWalletClick = useCallback((wallet: Wallet) => {
    router.push(`/wallet/${wallet.address}`)
  }, [router])

  const selectNetwork = useBoolean()

  const Header = <>
    {selectNetwork.current && <NetworkSelectionDialog close={selectNetwork.disable} />}
    <div className="flex p-md text-colored rounded-b-xl border-b md:border-l md:border-r border-violet6 bg-violet2 justify-between">
      <ContrastTextButton className="w-[150px]">
        <img className="icon-sm md:w-16 md:h-6" 
          src="/logo.svg"/>
          <span className="text-sm md:text-base">
            Brume
          </span>
      </ContrastTextButton>
      <ContrastTextButton className="w-full sm:w-[250px]"
        onClick={selectNetwork.enable}>
        <span className="text-sm md:text-base">
          {"Goerli Tesnet"}
        </span>
      </ContrastTextButton>
      <ContrastTextButton className="w-[150px]">
        <span className="text-sm md:text-base">
          Tor
        </span>
        <ShieldCheckIcon className="icon-sm md:icon-base text-grass8" />
      </ContrastTextButton>
    </div>
  </>

  const CreateButton =
    <OppositeTextButton className="text-lg md:text-xl" onClick={creator.enable}>
      Add wallet
    </OppositeTextButton>

  const WalletsList = <div>
    {wallets.data?.map(wallet =>
    <ClickableWalletRow
      key={wallet.address}
      wallet={wallet}
      ok={onWalletClick} />)}
  </div>
  

  const Body = <>
    <ul className="flex flex-col overflow-scroll">
      {WalletsList}
    </ul>
    <div className="grow"/>
    <div className="h-1 md:h-4" />
    <div className="p-md">{CreateButton}</div>
    <div className="h-1 md:h-4" />
  </>
    

  return <main className="h-full flex flex-col">
    {Header}
    <div className="h-8" />
    <span className="text-center text-colored text-2xl font-bold">My Wallets</span>
    <div className="h-2" />
    {creator.current &&
      <WalletCreatorDialog
        close={creator.disable} />}
    <div className="h-2" />
    {Body}
  </main>
}

export function ClickableWalletRow(props: WalletProps & OkProps<Wallet>) {
  const { ok, wallet } = props

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <div className="p-md cursor-pointer"
    onClick={onClick}>
    <WalletRow wallet={wallet} />
  </div>
}
