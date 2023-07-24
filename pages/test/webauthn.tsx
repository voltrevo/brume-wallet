import { WebAuthnStorage } from "@/libs/webauthn/webauthn";
import { Bytes } from "@hazae41/bytes";
import { useCallback, useState } from "react";

export default function Page() {
  const [idBase64 = "", setIdBase64] = useState<string>()
  const [dataUtf8 = "", setDataUtf8] = useState<string>()

  const create = useCallback(async () => {
    const id = await WebAuthnStorage
      .create("test", Bytes.fromUtf8("hello world"))
      .then(r => r.unwrap())
    setIdBase64(Bytes.toBase64(id))
  }, [])

  const get = useCallback(async () => {
    const data = await WebAuthnStorage
      .get(Bytes.fromBase64(idBase64))
      .then(r => r.unwrap())
    setDataUtf8(Bytes.toUtf8(data))
  }, [idBase64])

  return <>
    <input
      placeholder="id"
      value={idBase64}
      onChange={e => setIdBase64(e.currentTarget.value)}
    />
    <button onClick={create}>
      create
    </button>
    <div>
      {dataUtf8}
    </div>
    <button onClick={get}>
      get
    </button>
  </>
}