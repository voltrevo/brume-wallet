import { Circuit } from "@hazae41/echalote"
import { Pool } from "@hazae41/piscine"
import { createSession, Session } from "./session"

export function createSessionPool(url: URL, circuits: Pool<Circuit>) {
  const { capacity } = circuits

  return new Pool<Session>(async ({ index, destroy, signal }) => {
    const circuit = await circuits.get(index)

    const session = await createSession(url, circuit, signal)

    const onCloseOrError = () => {
      session.socket.removeEventListener("close", onCloseOrError)
      session.socket.removeEventListener("error", onCloseOrError)

      destroy()
    }

    session.socket.addEventListener("close", onCloseOrError)
    session.socket.addEventListener("error", onCloseOrError)

    return session
  }, { capacity })
}