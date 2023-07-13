import { EthereumChain } from "@/libs/ethereum/chain"
import { Data, IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"
import { Wallet } from "../wallets/data"

export type Session =
  | SessionData
  | SessionRef

export interface SessionRef {
  ref: true
  id: string
}

export interface SessionData {
  id: string,
  origin: string
  chain: EthereumChain
  wallets: [Wallet]
}

export function getSession(id: string, storage: IDBStorage) {
  return createQuerySchema<string, SessionData, never>({ key: `session/v3/${id}`, storage })
}

export async function getSessionRef(session: Session, storage: IDBStorage, more: NormalizerMore): Promise<SessionRef> {
  if ("ref" in session) return session

  const schema = getSession(session.origin, storage)
  await schema?.normalize(new Data(session), more)

  return { ref: true, id: session.id }
}