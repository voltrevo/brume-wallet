import { Dialog } from "@/libs/modals/dialog";
import { useAsyncUniqueCallback } from "@/libs/react/async";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { Mutator } from "@/libs/xswr/pipes";
import { Bytes } from "@hazae41/bytes";
import { useState } from "react";
import { UserData } from "../data";
import { useUsers } from "./data";

namespace Password {

  export async function hash(password: string, salt: Uint8Array) {
    const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name: "PBKDF2" }, false, ["deriveBits"])

    return new Uint8Array(await crypto.subtle.deriveBits({
      name: "PBKDF2",
      salt: salt,
      iterations: 1_000_000,
      hash: "SHA-256"
    }, pbkdf2, 256))
  }

}

export function UserCreateDialog(props: CloseProps) {
  const { close } = props

  const users = useUsers()

  const [name = "", setName] = useState<string>()

  const onNameChange = useInputChange(e => {
    setName(e.currentTarget.value)
  }, [])

  const [password = "", setPassword] = useState<string>()

  const onPasswordChange = useInputChange(e => {
    setPassword(e.currentTarget.value)
  }, [])

  const onClick = useAsyncUniqueCallback(async () => {
    const uuid = crypto.randomUUID()

    const keySalt = Bytes.toBase64(Bytes.random(16))
    const valueSalt = Bytes.toBase64(Bytes.random(16))

    const salt = Bytes.random(16)
    const hash = await Password.hash(password, salt)

    const passwordSalt = Bytes.toBase64(salt)
    const passwordHash = Bytes.toBase64(hash)

    const user: UserData = { name, uuid, keySalt, valueSalt, passwordSalt, passwordHash }
    users.mutate(Mutator.data((d = []) => [...d, user]))

    close()
  }, [name])

  return <Dialog close={close}>
    <input className="w-full"
      placeholder="Name"
      value={name}
      onChange={onNameChange} />
    <input className="w-full"
      placeholder="Password"
      value={password}
      onChange={onPasswordChange} />
    <button className="w-full"
      onClick={onClick.run}>
      Add
    </button>
  </Dialog>
}