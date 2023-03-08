import { Types } from "@/libs/types/types";
import { WalletPage } from "@/mods/entities/wallets/page";
import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter()

  const address = Types.asStringOr(router.query.address, undefined)

  if (!address) return null

  return <WalletPage address={address} />
}