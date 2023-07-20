import { ChildrenProps } from "@/libs/react/props/children";
import { Option, Optional } from "@hazae41/option";
import { Result } from "@hazae41/result";
import { Core, RawState, Storage, useCore } from "@hazae41/xswr";
import { createContext, useContext, useRef } from "react";
import { Background } from "../background/background";
import { useBackground } from "../background/context";
import { Subscriber } from "./storage";

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

export class UserStorage implements Storage {
  readonly async: true = true

  readonly subscriber: Subscriber

  constructor(
    readonly core: Core,
    readonly background: Background
  ) {
    this.subscriber = new Subscriber(this.core, this.background)
  }

  async get(cacheKey: string) {
    return await this.tryGet(cacheKey).then(r => r.unwrap().unwrap())
  }

  async tryGet(cacheKey: string) {
    return await this.background.tryRequest<RawState>({ method: "brume_get_user", params: [cacheKey] })
  }

  async trySubscribe(cacheKey: string): Promise<Result<void, Error>> {
    return await this.subscriber.trySubscribe(cacheKey)
  }

}