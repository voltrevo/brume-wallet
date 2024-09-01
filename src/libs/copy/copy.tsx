import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { Result } from "@hazae41/result";
import { Errors } from "../errors/errors";
import { useAsyncUniqueCallback } from "../react/callback";

export function useCopy(text?: string) {
  const { current, enable, disable } = useBooleanHandle(false)

  const { run } = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (!text) return

    await Result.runAndWrap(async () => {
      await navigator.clipboard.writeText(text)
    }).then(r => r.getOrThrow()).catch(console.warn)

    enable()

    setTimeout(() => {
      disable()
    }, 600)
  }), [text])

  return { current, run }
}