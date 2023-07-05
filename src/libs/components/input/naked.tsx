import { InputProps } from "@/libs/react/props/html";
import { RefProps } from "@/libs/react/props/ref";
import { Input } from "../input";

export function Naked(props: InputProps & RefProps<HTMLInputElement>) {
  const { children, className, xref, ...input } = props

  return <input className={`px-4 py-2 rounded-full outline-none ${className}`}
    ref={xref}
    {...input}>
    {children}
  </input>
}

export namespace Naked {

  export function Test() {
    return <div className="p-1">
      <Input.Naked placeholder="Hello world" />
    </div>
  }

}