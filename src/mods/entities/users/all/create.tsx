import { Dialog } from "@/libs/modals/dialog";
import { useAsyncUniqueCallback } from "@/libs/react/async";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { Mutator } from "@/libs/xswr/pipes";
import { Bytes } from "@hazae41/bytes";
import { useState } from "react";
import { UserData } from "../data";
import { Password } from "../password";
import { useUsers } from "./data";

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

    const passwordSaltBytes = Bytes.random(16)
    const passwordHashBytes = await Password.hash(password, passwordSaltBytes)

    const passwordSalt = Bytes.toBase64(passwordSaltBytes)
    const passwordHash = Bytes.toBase64(passwordHashBytes)

    const user: UserData = { name, uuid, keySalt, valueSalt, passwordSalt, passwordHash }

    users.mutate(Mutator.data((d = []) => [...d, user]))

    close()
  }, [name, password])

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