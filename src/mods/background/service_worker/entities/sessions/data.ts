import { NormalizerMore, createQuerySchema } from "@hazae41/xswr"

export type Session =
  | SessionRef
  | SessionData

export interface SessionProps {
  session: Session
}

export interface SessionDataProps {
  session: SessionData
}

export interface SessionRef {
  ref: true
  uuid: string
}

export interface SessionData {
  uuid: string
}

export function getSession(uuid: string) {
  return createQuerySchema<string, SessionData, never>(`session/${uuid}`, undefined)
}

export async function getSessionRef(session: Session, more: NormalizerMore) {
  if ("ref" in session) return session

  const schema = getSession(session.uuid)
  await schema?.normalize(session, more)

  return { ref: true, uuid: session.uuid } as SessionRef
}