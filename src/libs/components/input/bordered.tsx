import { InputProps } from "@/libs/react/props/html";
import { RefProps } from "@/libs/react/props/ref";
import { Input } from "../input";

export function Bordered(props: InputProps & RefProps<HTMLInputElement>) {
  const { children, className, xref, ...input } = props

  return <input className={`px-4 py-2 rounded-full outline-none border border-contrast clicked-or-focused:border-opposite transition ${className}`}
    ref={xref}
    {...input}>
    {children}
  </input>
}

export namespace Bordered {

  export function Test() {
    return <div className="p-1">
      <Input.Bordered placeholder="Hello world" />
    </div>
  }

}