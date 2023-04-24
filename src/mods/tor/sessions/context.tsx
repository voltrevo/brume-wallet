import { useAsyncMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { createSessionPool } from "@/libs/tor/sessions/pool";
import { Session } from "@/libs/tor/sessions/session";
import { Mutex } from "@hazae41/mutex";
import { Pool } from "@hazae41/piscine";
import { createContext, useContext, useMemo } from "react";
import { useCircuits } from "../circuits/context";

export const SessionsContext =
  createContext<Mutex<Pool<Session>> | undefined>(undefined)

export function useSessions() {
  return useContext(SessionsContext)
}

export namespace Sessions {

  export const all = new Map<string, Session>()

  export async function takeLocked(sessions: Pool<Session>) {
    const session = await sessions.cryptoRandom()
    sessions.delete(session)
    return session
  }

  export async function take(sessions: Mutex<Pool<Session>>) {
    return await sessions.lock(takeLocked)
  }

  export async function getOrTake(uuid: string, sessions: Mutex<Pool<Session>>) {
    let session = all.get(uuid)
    if (session) return session

    session = await take(sessions)
    all.set(uuid, session)

    const destroy = () => {
      all.delete(uuid)
    }

    session.socket.addEventListener("close", destroy)
    session.socket.addEventListener("error", destroy)

    return session
  }

}

export function useSession(uuid: string, sessions?: Mutex<Pool<Session>>) {
  return useAsyncMemo(async () => {
    if (!sessions) return

    return await Sessions.getOrTake(uuid, sessions)
  }, [uuid, sessions])
}

export function SessionsProvider(props: ChildrenProps) {
  const { children } = props

  const circuits = useCircuits()

  const sessions = useMemo(() => {
    if (!circuits) return

    const url = new URL("wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8")

    return new Mutex(createSessionPool(url, circuits))
  }, [circuits])

  return <SessionsContext.Provider value={sessions}>
    {children}
  </SessionsContext.Provider>
}