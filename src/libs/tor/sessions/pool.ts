import { Circuit } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { Pool } from "@hazae41/piscine"
import { createSession, Session } from "./session"

export function createSessionPool(url: URL, circuits: Pool<Circuit>) {
  const { capacity } = circuits

  const mutex = new Mutex(undefined)

  return new Pool<Session>(async ({ pool, signal }) => {
    const circuit = await mutex.lock(async () => {
      const circuit = await circuits.cryptoRandom()
      circuits.delete(circuit)
      return circuit
    })

    const session = await createSession(url, circuit, signal)

    const onCloseOrError = () => {
      session.socket.removeEventListener("close", onCloseOrError)
      session.socket.removeEventListener("error", onCloseOrError)

      pool.delete(session)
    }

    session.socket.addEventListener("close", onCloseOrError)
    session.socket.addEventListener("error", onCloseOrError)

    return session
  }, { capacity })
}