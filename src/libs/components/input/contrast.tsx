import { InputProps } from "@/libs/react/props/html";
import { RefProps } from "@/libs/react/props/ref";
import { Input } from "../input";

export function Contrast(props: InputProps & RefProps<HTMLInputElement>) {
  const { children, className, xref, ...input } = props

  return <input className={`px-4 py-2 rounded-full outline-none border border-transparent clicked-or-focused:border-contrast bg-contrast transition ${className}`}
    ref={xref}
    {...input}>
    {children}
  </input>
}

export namespace Contrast {

  export function Test() {
    return <div className="p-1">
      <Input.Contrast placeholder="Hello world" />
    </div>
  }

}