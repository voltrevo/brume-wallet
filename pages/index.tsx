import { WalletsPage } from "@/mods/entities/wallets/all/page"
import { WalletPage } from "@/mods/entities/wallets/page"

export default function Home() {
  if (location.hash === undefined)
    return null
  if (location.hash.startsWith("#/wallet"))
    return <WalletPage />
  return <WalletsPage />
}
