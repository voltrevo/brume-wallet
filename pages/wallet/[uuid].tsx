import { Types } from "@/libs/types/types";
import { WalletPage } from "@/mods/foreground/entities/wallets/page";
import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter()

  const uuid = Types.asStringOr(router.query.uuid, undefined)

  if (!uuid) return null

  return <WalletPage uuid={uuid} />
}