import { Types } from "@/libs/types/types";
import { WalletPage } from "@/mods/entities/wallets/page";
import { GetStaticPaths } from "next";
import { useRouter } from "next/router";

export const getStaticPaths: GetStaticPaths = async function () {
  return { paths: [], fallback: "blocking" }
}

export default function Page() {
  const router = useRouter()

  const address = Types.asString(router.query.address)

  return <WalletPage address={address} />
}