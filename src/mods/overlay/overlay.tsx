import { ChildrenProps } from "@/libs/react/props/children";

export function Overlay(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full bg-cover bg-center"
    style={{ backgroundImage: "url('https://aztec.network/images/city2.jpg')" }}>
    <div className="m-auto max-w-3xl h-full bg-violet1 p-4">
      {children}
    </div>
  </div>
}
