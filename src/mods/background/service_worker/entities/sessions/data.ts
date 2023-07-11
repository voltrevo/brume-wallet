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
  wallet: Wallet
  chain: EthereumChain
}

export function getSession(id: string, storage: IDBStorage) {
  return createQuerySchema<string, SessionData, never>({ key: `sessions/v2/${id}`, storage })
}

export async function getSessionRef(session: Session, storage: IDBStorage, more: NormalizerMore): Promise<SessionRef> {
  if ("ref" in session) return session

  const schema = getSession(session.origin, storage)
  await schema?.normalize(new Data(session), more)

  return { ref: true, id: session.id }
}