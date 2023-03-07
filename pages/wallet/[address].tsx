import { Types } from "@/libs/types/types";
import { WalletPage } from "@/mods/entities/wallets/page";
import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter()

  const address = Types.asString(router.query.address)

  return <WalletPage address={address} />
}