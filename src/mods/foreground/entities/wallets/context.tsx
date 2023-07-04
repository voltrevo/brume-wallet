import { ChildrenProps } from "@/libs/react/props/children"
import { UUIDProps } from "@/libs/react/props/uuid"
import { Option, Optional } from "@hazae41/option"
import { createContext, useContext } from "react"
import { useBackground } from "../../background/context"
import { WalletData, useWallet } from "./data"

export const WalletDataContext =
  createContext<Optional<WalletData>>(undefined)

export function useWalletData() {
  return Option.unwrap(useContext(WalletDataContext))
}

export function WalletDataProvider(props: UUIDProps & ChildrenProps) {
  const { uuid, children } = props
  const background = useBackground()

  const wallet = useWallet(uuid, background)

  if (wallet.data == null)
    return null

  return <WalletDataContext.Provider value={wallet.data.inner}>
    {children}
  </WalletDataContext.Provider>
}
