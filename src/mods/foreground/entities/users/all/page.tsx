/* eslint-disable @next/next/no-img-element */
import { Gradients } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { Events, useMouse } from "@/libs/react/events";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { ChildrenProps } from "@/libs/react/props/children";
import { ClassNameProps } from "@/libs/react/props/className";
import { ColorIndexProps } from "@/libs/react/props/color";
import { AnchorProps, ButtonProps } from "@/libs/react/props/html";
import { NameProps } from "@/libs/react/props/name";
import { OkProps } from "@/libs/react/props/promise";
import { SubtitleProps, TitleProps } from "@/libs/react/props/title";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Loading } from "@/libs/ui/loading/loading";
import { Page } from "@/libs/ui2/page/page";
import { User, UserDataProps, UserProps } from "@/mods/background/service_worker/entities/users/data";
import { OneDisplay } from "@/mods/foreground/landing/1/1";
import { ThreeDisplay } from "@/mods/foreground/landing/3/3";
import { PathContext, useSubpath } from "@/mods/foreground/router/path/context";
import { KeyboardEvent, useCallback, useState } from "react";
import { useUser, useUsers } from "../data";
import { UserLoginPage } from "../login";
import { UserCreateDialog } from "./create";

export function UsersPage2(props: OkProps<User>) {
  const { ok } = props

  const subpath = useSubpath()

  return <>
    {subpath.url.pathname === "/login" &&
      <UsersPage ok={ok} />}
    {subpath.url.pathname !== "/login" &&
      <div className="grow w-full flex flex-col overflow-y-scroll">
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
              <SmallShrinkableOppositeAnchor
                href={subpath.go("/login").href}>
                <Outline.LockOpenIcon className="size-5" />
                Login
              </SmallShrinkableOppositeAnchor>
              <div className="w-2" />
              <SmallShrinkableContrastAnchor
                href={subpath.go("/download").href}>
                <Outline.ArrowDownTrayIcon className="size-5" />
                Download
              </SmallShrinkableContrastAnchor>
            </div>
            <div className="grow" />
            <div className="grow" />
          </div>
          <div className="grid place-items-stretch gap-4 grid-cols-[repeat(auto-fill,minmax(12rem,1fr))]">
            <InfoCard
              title="0 VC"
              href="/1"
              subtitle={`Fully crowdfunded by the community and for the community. No grants. No VCs.`}>
              <OneDisplay />
            </InfoCard>
            <InfoCard
              title="Tor"
              href="/2"
              subtitle={`Built-in Tor to hide your IP address from third-parties. Each account has it's own IP.`} />
            <InfoCard
              title="~50"
              href="/3"
              subtitle={`Number of external dependencies. That's around 20x less than competitors.`}>
              <ThreeDisplay />
            </InfoCard>
            <InfoCard
              title="Auth"
              href="/4"
              subtitle={`You can use WebAuthn to authenticate and sign transactions. All your keys are stored encrypted.`} />
            <InfoCard
              title="Truth"
              href="/5"
              subtitle={`Each request is sent to multiple servers to ensure no one lies about the blockchain state.`} />
            <InfoCard
              title="MIT"
              href="/6"
              subtitle={`All our code is MIT-licensed reproducible open-source. You can build it yourself.`} />
          </div>
          <div className="h-16" />
          <div className="text-center text-2xl font-medium"
            id={subpath.go("/download").hash.slice(1)}>
            Download
          </div>
          <div className="h-8" />
          <div className="grid place-items-stretch gap-4 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
            <DownloadCard
              highlighted={typeof window.chrome !== "undefined"}
              title="Chrome-like"
              src="/assets/browsers/chrome.png"
              href="https://chromewebstore.google.com/detail/brume-wallet/oljgnlammonjehmmfahdjgjhjclpockd">
              Chrome, Brave, Chromium, Edge, Opera, Vivaldi
            </DownloadCard>
            <DownloadCard
              highlighted={navigator.userAgent.indexOf("Firefox") != -1}
              title="Firefox-like"
              src="/assets/browsers/firefox.png"
              href="https://addons.mozilla.org/firefox/addon/brumewallet/">
              Firefox, Waterfox, Pale Moon, Basilisk, IceCat, IceWeasel
            </DownloadCard>
          </div>
          <div className="h-4" />
          <WideShrinkableContrastAnchor
            target="_blank" rel="noreferrer"
            href="https://github.com/brumewallet/wallet/releases">
            <Outline.ArrowTopRightOnSquareIcon className="size-5" />
            All releases
          </WideShrinkableContrastAnchor>
          <div className="h-[50vh]" />
          <div className="text-center p-4">
            <TextAnchor
              target="_blank" rel="noreferrer"
              href="https://ethbrno.cz">
              Made by cypherpunks
            </TextAnchor>
          </div>
        </div>
      </div>}
  </>
}

export function UsersScreen(props: {}) {
  const close = useCloseContext().unwrap()

  const usersQuery = useUsers()
  const maybeUsers = usersQuery.current?.ok().get()

  return <>
    <Dialog.Title>
      Login
    </Dialog.Title>
    <div className="h-4" />
    <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
      {maybeUsers?.map(user =>
        <UserCard
          key={user.uuid}
          user={user} />)}
      <NewUserCard />
    </div>
  </>
}

export function UserCard(props: UserProps) {
  const { user } = props

  const userQuery = useUser(user.uuid)
  const maybeUser = userQuery.current?.ok().get()

  if (maybeUser == null)
    return null

  return <div className="po-md bg-contrast rounded-xl flex items-center">
    <UserAvatar2 className="size-12 text-2xl"
      user={maybeUser} />
    <div className="w-4" />
    <div className="font-medium">
      {maybeUser.name}
    </div>
  </div>
}

export function NewUserCard() {
  return <div className="po-md bg-contrast rounded-xl flex items-center">
    <div className="rounded-full size-12 flex justify-center items-center border border-contrast border-dashed">
      <Outline.PlusIcon className="size-6" />
    </div>
    <div className="w-4" />
    <div className="font-medium">
      New user
    </div>
  </div>

}

export function InfoCard(props: TitleProps & SubtitleProps & ChildrenProps & AnchorProps & { href: string }) {
  const { children, title, subtitle, href, ...rest } = props
  const subpath = useSubpath()

  const onClick = useMouse(e => {
    if (e.button !== 0)
      return

    e.preventDefault()

    const x = e.clientX
    const y = e.clientY

    location.href = subpath.go(`${href}?x=${x}&y=${y}`).href
  }, [href, subpath])

  const onEnter = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Enter")
      return

    e.preventDefault()

    const x = e.currentTarget.getBoundingClientRect().x + (e.currentTarget.getBoundingClientRect().width / 2)
    const y = e.currentTarget.getBoundingClientRect().y + (e.currentTarget.getBoundingClientRect().height / 2)

    location.href = subpath.go(`${href}?x=${x}&y=${y}`).href
  }, [href, subpath])

  const onSubpathClose = useCallback(() => {
    location.href = subpath.go("/").href
  }, [subpath])

  return <>
    <PathContext.Provider value={subpath}>
      {subpath.url.pathname === href &&
        <Dialog close={onSubpathClose}>
          <div className="text-6xl">
            {title}
          </div>
          <div className="h-2" />
          <div className="text-contrast">
            {subtitle}
          </div>
          <div className="h-8" />
          {children == null &&
            <div className="whitespace-pre-wrap">
              {`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non vulputate lorem. Integer turpis urna, elementum ac odio id, eleifend fringilla nisl. Aliquam vulputate, lacus eget congue porta, dolor lacus auctor ex, nec egestas dolor sem quis lorem. Nam tincidunt egestas est at porta. Maecenas in ultrices libero. Sed maximus purus lacus, eget pulvinar lacus tempor sit amet. Sed sit amet sagittis quam. Maecenas eget rutrum quam, quis venenatis ipsum. Cras cursus iaculis maximus. Donec convallis tempus orci, a consectetur eros cursus non. Sed tristique convallis eros, mattis luctus justo tincidunt non. Vivamus facilisis ex ipsum, a viverra libero vehicula ac. Vestibulum at eleifend eros, vel aliquet tellus. Vestibulum faucibus dignissim turpis. Nam in magna mauris. Nunc nulla metus, commodo vel euismod eu, tincidunt ut leo. Cras sit amet convallis dolor. Nunc vel nulla vel nisl tristique consequat. In sollicitudin eget ligula quis porttitor. Sed vel blandit quam. Ut fermentum nulla vel tortor placerat consequat. Donec ornare in dui sit amet dapibus. Morbi sit amet nulla vel lacus vestibulum dignissim. Fusce euismod, neque at porta interdum, mauris est hendrerit mauris, ut convallis nulla purus id mi. Suspendisse in facilisis augue. In in luctus velit. Nulla rutrum urna quis congue luctus. Ut sed sem leo. Quisque tellus magna, dapibus et est a, faucibus varius est. Vestibulum eu metus molestie odio interdum tincidunt. Aliquam in tincidunt lectus, at rutrum elit. Aenean malesuada nibh quis auctor sagittis. Phasellus aliquet nunc quis tempor placerat. Maecenas porttitor ante et orci faucibus molestie. In nisi diam, malesuada vitae varius non, luctus eu lacus. Ut ut sodales massa. Nunc eu turpis sed enim viverra ullamcorper sit amet a orci. Quisque tincidunt posuere sem, et bibendum dui porta ut. Vestibulum nunc ex, tincidunt ac vestibulum id, tincidunt non lacus. Nam molestie ante felis, et pretium massa condimentum vel. Donec feugiat ut nulla non eleifend. Fusce commodo nisi et aliquam pharetra. Aenean sagittis iaculis finibus. Donec fringilla ornare finibus. Cras fermentum viverra tellus, volutpat dignissim erat maximus sed. Curabitur bibendum, libero quis convallis imperdiet, leo felis consectetur nunc, eu pretium sem urna sed quam. Aenean lectus tortor, pretium quis semper eget, posuere at nisl. In eget mi lacus. Nulla facilisi. Vestibulum lobortis urna sed ex venenatis, quis lobortis orci varius. Proin ultricies consectetur laoreet. Vivamus elit neque, scelerisque egestas augue eget, congue ornare odio. Nam sed augue ex. Aliquam fermentum, felis et bibendum rutrum, neque lacus tempor quam, at condimentum diam sem a ante. Vestibulum accumsan justo ac scelerisque dictum. Curabitur molestie, odio quis rutrum viverra, odio sapien tempor arcu, et accumsan libero lacus ut ex. Nullam placerat fermentum justo, a tempus risus facilisis vitae. Etiam fringilla, ante in dictum finibus, elit ligula mattis diam, et scelerisque libero metus nec ligula. Nulla nec leo dictum nulla ultrices pulvinar. Fusce porta pretium dui, nec tempor enim. Proin ut sagittis est. Suspendisse vel nunc et nulla pellentesque faucibus hendrerit eu elit.`}
            </div>}
          {children != null && children}
        </Dialog>}
    </PathContext.Provider>
    <div className="p-6 aspect-square bg-contrast rounded-xl flex flex-col">
      <div className="text-6xl">
        {title}
      </div>
      <div className="h-4 grow" />
      <div className="">
        <span className="text-contrast">
          {subtitle}
        </span>
        <span>{` `}</span>
        <TextAnchor
          href={subpath.go(href).href}
          onClick={onClick}
          onKeyDown={onEnter}
          {...rest}>
          Learn more.
        </TextAnchor>
      </div>
    </div>
  </>
}

export function DownloadCard(props: TitleProps & ChildrenProps & { href: string } & { src: string } & { highlighted?: boolean }) {
  const { href, src, children, title, highlighted = false } = props

  const onClick = useCallback(() => {
    window.open(href, "_blank", "noreferrer")
  }, [href])

  return <div className="p-6 bg-contrast rounded-xl flex flex-col data-[highlighted=false]:opacity-50 transition-opacity"
    data-highlighted={highlighted}
    onClick={onClick}
    role="button">
    <div className="flex">
      <img className="size-24 object-contain"
        alt={title}
        src={src} />
      <div className="w-8 grow" />
      <div className="flex flex-col">
        <div className="font-medium text-2xl">
          {title}
        </div>
        <div className="h-1" />
        <div className="text-contrast">
          {children}
        </div>
      </div>
    </div>
    <div className="h-4 grow" />
    <div className="flex items-center">
      <WideShrinkableContrastAnchor
        target="_blank" rel="noreferrer"
        onClick={Events.keep}
        href={href}>
        <Outline.ArrowTopRightOnSquareIcon className="size-5" />
        Download
      </WideShrinkableContrastAnchor>
    </div>
  </div>
}

export function TextButton(props: ButtonProps) {
  const { children, ...rest } = props

  return <button className="inline outline-none hover:underline focus-visible:underline disabled:opacity-50 transition-opacity"
    {...rest}>
    {children}
  </button>
}

export function TextAnchor(props: AnchorProps) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="outline-none hover:underline focus-visible:underline aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    {children}
  </a>
}

export function SmallShrinkableOppositeButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-md bg-opposite text-opposite rounded-xl outline-none enabled:hover:bg-opposite-hover focus-visible:outline-opposite disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function SmallShrinkableContrastButton(props: ChildrenProps & ButtonProps) {
  const { children, ...rest } = props

  return <button className="group po-md bg-contrast rounded-xl outline-none enabled:hover:bg-contrast-hover focus-visible:outline-opposite disabled:opacity-50 transition-opacity" {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-enabled:group-active:scale-90 transition-transform">
      {children}
    </div>
  </button>
}

export function SmallShrinkableOppositeAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: boolean }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="group po-md bg-opposite text-opposite rounded-xl outline-none aria-[disabled=false]:hover:bg-opposite-hover focus-visible:outline-opposite aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
      {children}
    </div>
  </a >
}

export function SmallShrinkableContrastAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: boolean }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="group po-md bg-contrast rounded-xl outline-none aria-[disabled=false]:hover:bg-contrast-hover focus-visible:outline-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
      {children}
    </div>
  </a >
}

export function WideShrinkableOppositeAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: boolean }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="grow basis-0 group po-md bg-opposite border border-opposite text-opposite rounded-xl outline-none aria-[disabled=false]:hover:bg-opposite-hover focus-visible:outline-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
      {children}
    </div>
  </a>
}

export function WideShrinkableContrastAnchor(props: ChildrenProps & AnchorProps & { "aria-disabled"?: boolean }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="grow basis-0 group po-md bg-contrast rounded-xl outline-none aria-[disabled=false]:hover:bg-contrast-hover focus-visible:outline-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <div className="h-full w-full flex items-center justify-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
      {children}
    </div>
  </a>
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

export function UserAvatar2(props: ClassNameProps & UserDataProps) {
  const { user, className } = props

  const [color1, color2] = Gradients.get(user.color)

  return <div className={`bg-gradient-to-br from-${color1} to-${color2} rounded-full flex justify-center items-center ${className} text-white`}>
    {user.name[0]}
  </div>
}

export function UserAvatar(props: ClassNameProps & ColorIndexProps & NameProps) {
  const { colorIndex: color, name, className } = props

  const [color1, color2] = Gradients.get(color)

  return <div className={`bg-gradient-to-br from-${color1} to-${color2} rounded-full flex justify-center items-center ${className} text-white`}>
    {name[0]}
  </div>
}