/* eslint-disable @next/next/no-img-element */
import { Gradients } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { ChildrenProps } from "@/libs/react/props/children";
import { ClassNameProps } from "@/libs/react/props/className";
import { ColorIndexProps } from "@/libs/react/props/color";
import { ButtonProps } from "@/libs/react/props/html";
import { NameProps } from "@/libs/react/props/name";
import { OkProps } from "@/libs/react/props/promise";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Loading } from "@/libs/ui/loading/loading";
import { Page } from "@/libs/ui2/page/page";
import { User, UserProps } from "@/mods/background/service_worker/entities/users/data";
import { useCallback, useState } from "react";
import { useUser, useUsers } from "../data";
import { UserLoginPage } from "../login";
import { UserCreateDialog } from "./create";

export function UsersPage2(props: OkProps<User>) {
  return <div className="grow w-full flex flex-col overflow-y-scroll">
    <div className="po-md border-b-contrast">
      <div className="grow w-full m-auto max-w-6xl flex items-center">
        <img className="size-8"
          alt="Brume Wallet"
          src="/favicon.png" />
        <div className="w-2" />
        <div className="font-medium">
          Wallet
        </div>
      </div>
    </div>
    <div className="p-4 grow w-full m-auto max-w-3xl flex flex-col">
      <div className="h-[32rem] shrink-0 grow flex flex-col items-center">
        <div className="grow" />
        <h1 className="text-center text-6xl font-medium">
          The private Ethereum wallet
        </h1>
        <div className="h-4" />
        <div className="text-center text-contrast text-2xl">
          Meet the only Ethereum wallet with maximum privacy and security.
        </div>
        <div className="grow" />
        <div className="flex items-center">
          <SmallShrinkableOppositeButton>
            <Outline.LockOpenIcon className="size-5" />
            Login
          </SmallShrinkableOppositeButton>
          <div className="w-2" />
          <SmallShrinkableContrastButton>
            <Outline.ArrowDownTrayIcon className="size-5" />
            Download
          </SmallShrinkableContrastButton>
        </div>
        <div className="grow" />
        <div className="grow" />
      </div>
      <div className="grid place-items-stretch gap-4 grid-cols-[repeat(auto-fill,minmax(12rem,1fr))]">
        <div className="p-6 aspect-square bg-contrast rounded-xl flex flex-col">
          <div className="text-6xl">
            0 VC
          </div>
          <div className="h-4 grow" />
          <div>
            <span className="text-contrast">
              Fully crowdfunded by the community and for the community. No grants. No VCs.
            </span>
            <span>{` `}</span>
            <button className="inline">
              Learn more.
            </button>
          </div>
        </div>
        <div className="p-6 aspect-square bg-contrast rounded-xl flex flex-col">
          <div className="text-6xl">
            Tor
          </div>
          <div className="h-4 grow" />
          <div>
            <span className="text-contrast">
              {`We use built-in Tor to hide your IP address from third-parties. Each account has it's own IP address.`}
            </span>
            <span>{` `}</span>
            <button className="inline">
              Learn more.
            </button>
          </div>
        </div>
        <div className="p-6 aspect-square bg-contrast rounded-xl flex flex-col">
          <div className="text-6xl">
            ~40
          </div>
          <div className="h-4 grow" />
          <div>
            <span className="text-contrast">
              {`Number of external dependencies. That's around 20x less than competitors.`}
            </span>
            <span>{` `}</span>
            <button className="inline">
              Learn more.
            </button>
          </div>
        </div>
        <div className="p-6 aspect-square bg-contrast rounded-xl flex flex-col">
          <div className="text-6xl">
            Auth
          </div>
          <div className="h-4 grow" />
          <div>
            <span className="text-contrast">
              {`You can use WebAuthn to authenticate and sign transactions. All your keys are double-encrypted.`}
            </span>
            <span>{` `}</span>
            <button className="inline">
              Learn more.
            </button>
          </div>
        </div>
        <div className="p-6 aspect-square bg-contrast rounded-xl flex flex-col">
          <div className="text-6xl">
            Truth
          </div>
          <div className="h-4 grow" />
          <div>
            <span className="text-contrast">
              {`Each request is sent to multiple servers to ensure no one lies about the blockchain state.`}
            </span>
            <span>{` `}</span>
            <button className="inline">
              Learn more.
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export function SmallShrinkableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-md bg-opposite text-opposite rounded-xl outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function SmallShrinkableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-md bg-contrast rounded-xl outline-none disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function UsersPage(props: OkProps<User>) {
  const { ok } = props

  const [user, setUser] = useState<User>()

  const clear = useCallback(() => setUser(undefined), [])

  const users = useUsers()

  const createDialog = useBooleanHandle(false)

  if (user != null)
    return <UserLoginPage
      user={user}
      ok={ok}
      err={clear} />

  if (!users.ready)
    return <div className="grow flex items-center justify-center">
      <Loading className="size-10" />
    </div>

  return <Page>
    {createDialog.current &&
      <Dialog
        close={createDialog.disable}>
        <UserCreateDialog />
      </Dialog>}
    <div className="grid grow place-items-center place-content-center grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] auto-rows-[10rem]">
      {users.data?.get().map(user =>
        <UserOkButton
          key={user.uuid}
          user={user}
          ok={setUser} />)}
      <NewUserButton ok={createDialog.enable} />
    </div>
  </Page>
}

function UserOkButton(props: UserProps & OkProps<User>) {
  const { ok } = props

  const user = useUser(props.user.uuid)

  const onClick = useCallback(() => {
    ok(props.user)
  }, [props.user, ok])

  if (user.data == null)
    return null

  return <button className="flex flex-col items-center"
    onClick={onClick}>
    <UserAvatar className="size-16 text-2xl"
      colorIndex={user.data.get().color}
      name={user.data.get().name} />
    <div className="h-1" />
    <div className="font-medium">
      {user.data.get().name}
    </div>
  </button>
}

function NewUserButton(props: OkProps<unknown>) {
  const { ok } = props

  return <button className="flex flex-col items-center"
    onClick={ok}>
    <div className="rounded-full size-16 flex justify-center items-center border border-contrast border-dashed">
      <Outline.PlusIcon className="size-6" />
    </div>
    <div className="h-1" />
    <div className="font-medium">
      New user
    </div>
  </button>
}

export function UserAvatar(props: ClassNameProps & ColorIndexProps & NameProps) {
  const { colorIndex: color, name, className } = props

  const [color1, color2] = Gradients.get(color)

  return <div className={`bg-gradient-to-br from-${color1} to-${color2} rounded-full flex justify-center items-center ${className} text-white`}>
    {name[0]}
  </div>
}