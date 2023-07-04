import { ChildrenProps } from "@/libs/react/props/children";
import { Option, Optional } from "@hazae41/option";
import { useCore } from "@hazae41/xswr";
import { createContext, useContext, useRef } from "react";
import { useBackground } from "../background/context";
import { UserStorage } from "./storage";

export const UserStorageContext =
  createContext<Optional<UserStorage>>(undefined)

export function useUserStorage() {
  return Option.wrap(useContext(UserStorageContext))
}

export function UserStorageProvider(props: ChildrenProps) {
  const { children } = props
  const core = useCore().unwrap()
  const background = useBackground()

  const storage = useRef<UserStorage>()

  if (storage.current == null)
    storage.current = new UserStorage(core, background)

  return <UserStorageContext.Provider value={storage.current}>
    {children}
  </UserStorageContext.Provider>
}