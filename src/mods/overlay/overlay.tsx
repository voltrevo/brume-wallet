import { ChildrenProps } from "@/libs/react/props/children";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full w-full bg-cover bg-center"
    style={{ backgroundImage: "url('https://aztec.network/images/city2.jpg')" }}>
    <main className="h-full w-full m-auto max-w-3xl bg-violet1 p-4">
      {children}
    </main>
  </div>
}
