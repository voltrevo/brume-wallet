/* eslint-disable @next/next/no-img-element */
import { Color } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { Events } from "@/libs/react/events";
import { ChildrenProps } from "@/libs/react/props/children";
import { ClassNameProps } from "@/libs/react/props/className";
import { AnchorProps } from "@/libs/react/props/html";
import { SubtitleProps, TitleProps } from "@/libs/react/props/title";
import { SmallShrinkableContrastAnchor, SmallShrinkableOppositeAnchor, TextAnchor, WideShrinkableContrastAnchor, WideShrinkableNakedMenuAnchor } from "@/libs/ui/anchor";
import { Dialog } from "@/libs/ui/dialog";
import { Loading } from "@/libs/ui/loading";
import { Menu } from "@/libs/ui/menu";
import { urlOf } from "@/libs/url/url";
import { User } from "@/mods/background/service_worker/entities/users/data";
import { OneDisplay } from "@/mods/foreground/landing/1/1";
import { TwoDisplay } from "@/mods/foreground/landing/2/2";
import { ThreeDisplay } from "@/mods/foreground/landing/3/3";
import { FourDisplay } from "@/mods/foreground/landing/4/4";
import { FiveDisplay } from "@/mods/foreground/landing/5/5";
import { SixDisplay } from "@/mods/foreground/landing/6/6";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { useCallback } from "react";
import { useCurrentUser, useUser, useUsers } from "../data";
import { UserLoginDialog } from "../login";
import { UserCreateDialog } from "./create";

export function EmptyLandingPage(props: { next?: string }) {
  const path = usePathContext().getOrThrow()
  const { next } = props

  const currentUserQuery = useCurrentUser()
  const currentUserLoading = !currentUserQuery.ready
  const maybeCurrentUser = currentUserQuery.current?.getOrNull()

  const userQuery = useUser(maybeCurrentUser?.uuid)
  const maybeUser = userQuery.current?.getOrNull()

  const subpath = useHashSubpath(path)
  const users = useCoords(subpath, "/users")

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === "/users/login" &&
        <Dialog>
          <UserLoginDialog next={next} />
        </Dialog>}
      {subpath.url.pathname === "/users/create" &&
        <Dialog>
          <UserCreateDialog next={next} />
        </Dialog>}
      {subpath.url.pathname === "/users" &&
        <Menu>
          <UsersMenu />
        </Menu>}
    </HashSubpathProvider>
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
        <div className="h-[max(24rem,100dvh_-_16rem)] flex-none flex flex-col items-center">
          <div className="grow" />
          <h1 className="text-center text-6xl font-medium">
            Welcome back<span className="text-contrast">, {maybeUser?.name || "anon"}</span>
          </h1>
          <div className="grow" />
          <div className="flex items-center">
            {currentUserLoading &&
              <SmallShrinkableOppositeAnchor
                aria-disabled>
                <Loading className="size-5" />
                Loading
              </SmallShrinkableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser == null &&
              <SmallShrinkableOppositeAnchor
                onKeyDown={users.onKeyDown}
                onClick={users.onClick}
                href={users.href}>
                <Outline.LockOpenIcon className="size-5" />
                Login
              </SmallShrinkableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser != null &&
              <SmallShrinkableOppositeAnchor
                href="#/home">
                <Outline.HomeIcon className="size-5" />
                Home
              </SmallShrinkableOppositeAnchor>}
          </div>
          <div className="grow" />
        </div>
      </div>
    </div>
  </>
}

export function FullLandingPage(props: { next?: string }) {
  const path = usePathContext().getOrThrow()
  const { next } = props

  const currentUserQuery = useCurrentUser()
  const currentUserLoading = !currentUserQuery.ready
  const maybeCurrentUser = currentUserQuery.data?.get()

  const subpath = useHashSubpath(path)
  const users = useCoords(subpath, "/users")

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === "/users/login" &&
        <Dialog>
          <UserLoginDialog next={next} />
        </Dialog>}
      {subpath.url.pathname === "/users/create" &&
        <Dialog>
          <UserCreateDialog next={next} />
        </Dialog>}
      {subpath.url.pathname === "/users" &&
        <Menu>
          <UsersMenu />
        </Menu>}
    </HashSubpathProvider>
    <div className="grow w-full flex flex-col overflow-y-scroll">
      <div className="po-md border-b-contrast">
        <div className="grow w-full m-auto max-w-6xl flex items-center">
          <div className="flex-1 flex items-center">
            <img className="size-8"
              alt="Brume Wallet"
              src="/favicon.png" />
            <div className="w-2" />
            <div className="font-medium">
              Wallet
            </div>
          </div>
          <div className="w-2" />
          <div className="flex-1 invisible md:visible flex items-center po-md bg-contrast rounded-xl">
            <Outline.SparklesIcon className="size-4" />
            <div className="w-2" />
            <input className="w-full bg-transparent outline-none"
              placeholder="tell me what you want" />
          </div>
          <div className="w-2" />
          <div className="flex-1" />
        </div>
      </div>
      <div className="p-4 grow w-full m-auto max-w-3xl flex flex-col">
        <div className="h-[max(24rem,100dvh_-_16rem)] flex-none flex flex-col items-center">
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
            {currentUserLoading &&
              <SmallShrinkableOppositeAnchor
                aria-disabled>
                <Loading className="size-5" />
                Loading
              </SmallShrinkableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser == null &&
              <SmallShrinkableOppositeAnchor
                onKeyDown={users.onKeyDown}
                onClick={users.onClick}
                href={users.href}>
                <Outline.LockOpenIcon className="size-5" />
                Login
              </SmallShrinkableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser != null &&
              <SmallShrinkableOppositeAnchor
                href="#/home">
                <Outline.HomeIcon className="size-5" />
                Home
              </SmallShrinkableOppositeAnchor>}
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
            subtitle={`Fully crowdfunded by the community for the community. No grants. No VCs.`}>
            <OneDisplay />
          </InfoCard>
          <InfoCard
            title="Tor"
            href="/2"
            subtitle={`Built-in Tor to hide your IP address from third-parties. Each account has it's own IP.`}>
            <TwoDisplay />
          </InfoCard>
          <InfoCard
            title="~50"
            href="/3"
            subtitle={`Number of external dependencies. That's around 20x less than competitors.`}>
            <ThreeDisplay />
          </InfoCard>
          <InfoCard
            title="Auth"
            href="/4"
            subtitle={`You can use WebAuthn to authenticate and sign transactions. All your keys are stored encrypted.`}>
            <FourDisplay />
          </InfoCard>
          <InfoCard
            title="Truth"
            href="/5"
            subtitle={`Each request is sent to multiple servers to ensure no one lies about the blockchain state.`}>
            <FiveDisplay />
          </InfoCard>
          <InfoCard
            title="MIT"
            href="/6"
            subtitle={`All our code is MIT-licensed reproducible open-source. You can build it yourself.`}>
            <SixDisplay />
          </InfoCard>
        </div>
        <div className="h-16" />
        <div className="text-center text-2xl font-medium"
          id={subpath.go("/download").hash.slice(1)}>
          Download
        </div>
        <div className="h-8" />
        <div className="grid place-items-stretch gap-4 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
          <DownloadCard
            highlighted={navigator.userAgent.includes("Chrome") && !navigator.userAgent.includes("Android")}
            icon={Outline.ArrowTopRightOnSquareIcon}
            title="Chrome-like"
            src="/assets/browsers/chrome.png"
            href="https://chromewebstore.google.com/detail/brume-wallet/oljgnlammonjehmmfahdjgjhjclpockd">
            Chrome, Brave, Chromium, Edge, Opera, Vivaldi
          </DownloadCard>
          <DownloadCard
            highlighted={navigator.userAgent.includes("Firefox") && !navigator.userAgent.includes("Android")}
            icon={Outline.ArrowTopRightOnSquareIcon}
            title="Firefox-like"
            src="/assets/browsers/firefox.png"
            href="https://addons.mozilla.org/firefox/addon/brumewallet/">
            Firefox, Waterfox, Pale Moon, Basilisk, IceCat, IceWeasel
          </DownloadCard>
          <DownloadCard
            highlighted={navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome") && !navigator.userAgent.includes("Android")}
            icon={Outline.ArrowTopRightOnSquareIcon}
            title="Safari"
            src="/assets/browsers/safari.svg"
            href="https://testflight.apple.com/join/WtNNiY98">
            iOS, iPadOS, macOS
          </DownloadCard>
          <DownloadCard
            highlighted={navigator.userAgent.includes("Android")}
            icon={Outline.ArrowDownTrayIcon}
            title="Android"
            src="/assets/browsers/android.svg"
            href="https://github.com/brumewallet/wallet/raw/main/dist/android.apk">
            Google, Samsung, Huawei, Xiaomi, Oppo, Vivo
          </DownloadCard>
        </div>
        <div className="h-4" />
        <WideShrinkableContrastAnchor
          target="_blank" rel="noreferrer"
          href="https://github.com/brumewallet/wallet#usage">
          <Outline.ArrowTopRightOnSquareIcon className="size-5" />
          More downloads
        </WideShrinkableContrastAnchor>
        <div className="h-[50vh]" />
        <div className="p-4 flex items-center justify-center gap-2">
          <TextAnchor
            target="_blank" rel="noreferrer"
            href="https://ethbrno.cz">
            Made by cypherpunks
          </TextAnchor>
          <span>
            ·
          </span>
          <span>
            v{process.env.VERSION}
          </span>
        </div>
      </div>
    </div>
  </>
}

export function UsersMenu() {
  const path = usePathContext().getOrThrow()

  const usersQuery = useUsers()
  const maybeUsers = usersQuery.current?.getOrNull()

  const create = useCoords(path, "/users/create")

  return <div className="flex flex-col text-left gap-2">
    {maybeUsers?.map(user =>
      <UsersMenuRow
        key={user.uuid}
        user={user} />)}
    <WideShrinkableNakedMenuAnchor
      onClick={create.onClick}
      onKeyDown={create.onKeyDown}
      href={create.href}>
      <div className="rounded-full size-7 flex justify-center items-center border border-contrast border-dashed">
        <Outline.PlusIcon className="size-4" />
      </div>
      New user
    </WideShrinkableNakedMenuAnchor>
  </div>
}

export function UsersMenuRow(props: { user: User }) {
  const path = usePathContext().getOrThrow()

  const userQuery = useUser(props.user.uuid)
  const maybeUser = userQuery.current?.getOrNull()

  const open = useCoords(path, urlOf("/users/login", { user: props.user.uuid }).href)

  if (maybeUser == null)
    return null

  return <WideShrinkableNakedMenuAnchor
    onClick={open.onClick}
    onKeyDown={open.onKeyDown}
    href={open.href}>
    <UserAvatar className="size-7 text-lg flex-none"
      color={Color.get(maybeUser.color)}
      name={maybeUser.name} />
    {maybeUser.name}
  </WideShrinkableNakedMenuAnchor>
}

export function InfoCard(props: TitleProps & SubtitleProps & ChildrenProps & AnchorProps & { href: string }) {
  const path = usePathContext().getOrThrow()
  const { children, title, subtitle, href, ...rest } = props

  const subpath = useHashSubpath(path)
  const genius = useCoords(subpath, href)

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === href &&
        <Dialog hesitant>
          <div className="text-6xl">
            {title}
          </div>
          <div className="h-2" />
          <div className="text-contrast">
            {subtitle}
          </div>
          <div className="h-8" />
          {children}
        </Dialog>}
    </HashSubpathProvider>
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
          onClick={genius.onClick}
          onKeyDown={genius.onKeyDown}
          href={genius.href}
          {...rest}>
          Learn more.
        </TextAnchor>
      </div>
    </div>
  </>
}

export function DownloadCard(props: TitleProps & ChildrenProps & { href: string } & { src: string } & { highlighted?: boolean } & { icon: any }) {
  const { href, src, children, title, highlighted = false, icon: Icon } = props

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
      <div className="w-8" />
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
        <Icon className="size-5" />
        Download
      </WideShrinkableContrastAnchor>
    </div>
  </div>
}

export function UserAvatar(props: ClassNameProps & { name: string } & { color: Color }) {
  const { color, name, className } = props

  return <div className={`bg-${color}-400 dark:bg-${color}-500 rounded-full flex justify-center items-center ${className} text-white`}>
    {Array.from(name)[0]}
  </div>
}