import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { Result } from "@hazae41/result";
import { useAsyncUniqueCallback } from "../react/callback";

export function useCopy(text?: string) {
  const { current, enable, disable } = useBooleanHandle(false)

  const { run } = useAsyncUniqueCallback(async () => {
    if (!text) return

    await Result.runAndWrap(async () => {
      await navigator.clipboard.writeText(text)
    }).then(r => r.ignore())

    enable()

    setTimeout(() => {
      disable()
    }, 600)
  }, [text])

  return { current, run }
}