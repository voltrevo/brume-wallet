import { Ok, Result } from "@hazae41/result";
import { useCallback, useState } from "react";

export default function Page() {
  const [url = "", setUrl] = useState<string>()

  const onClick = useCallback(async () => {
    if (!url) return

    return Result.unthrow<Result<void, Error>>(async t => {
      // Wc.tryPair(url).then(r => r.throw)

      return Ok.void()
    })

  }, [url])

  return <>
    <input placeholder="url"
      value={url}
      onChange={e => setUrl(e.currentTarget.value)} />
    <button onClick={onClick}>
      click me
    </button>
  </>
}