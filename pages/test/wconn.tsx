import { useCallback, useState } from "react";

export default function Page() {
  const [url, setUrl] = useState<string>()

  const onClick = useCallback(() => {
    if (!url) return

    const relay = "wss://relay.walletconnect.org"

    const { protocol, pathname, searchParams } = new URL(url)
    const [topic, version] = pathname.split("@")
    const relayProtocol = searchParams.get("relayProtocol")
    const symKey = searchParams.get("symKey")

    const auth = "" // TODO
    const projectId = "" // TODO
    const socket = new WebSocket(`${relay}/?auth=${auth}&projectId=${projectId}`)
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