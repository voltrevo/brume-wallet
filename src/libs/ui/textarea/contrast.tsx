import { TextareaProps } from "@/libs/react/props/html";
import { RefProps } from "@/libs/react/props/ref";
import { Textarea } from "../textarea";

export function Contrast(props: TextareaProps & RefProps<HTMLTextAreaElement>) {
  const { children, className, xref, ...input } = props

  return <textarea className={`px-4 py-2 rounded-xl outline-none border border-transparent clicked-or-focused:border-contrast bg-contrast transition ${className}`}
    ref={xref}
    {...input}>
    {children}
  </textarea>
}

export namespace Contrast {

  export function Test() {
    return <div className="p-1">
      <Textarea.Contrast placeholder="Hello world" />
    </div>
  }

}