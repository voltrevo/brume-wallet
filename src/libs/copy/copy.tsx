import { useBoolean } from "@/libs/react/handles/boolean";
import { useAsyncUniqueCallback } from "../react/async";

export function useCopy(text: string) {
  const { current, enable, disable } = useBoolean()

  const { run } = useAsyncUniqueCallback(async () => {
    await navigator.clipboard.writeText(text)
    enable()
    setTimeout(() => disable(), 600)
  }, [text], console.error)

  return { current, run }
}