import { EthereumChain } from "@/libs/ethereum/chain"
import { Data, IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"
import { Wallet } from "../wallets/data"

export type Session =
  | SessionData
  | SessionRef

export interface SessionRef {
  ref: true
  origin: string
}

export interface SessionData {
  origin: string
  wallet: Wallet
  chain: EthereumChain
}

export function getSession(origin: string, storage: IDBStorage) {
  return createQuerySchema<string, SessionData, never>({ key: `sessions/${origin}`, storage })
}

export async function getSessionRef(session: Session, storage: IDBStorage, more: NormalizerMore): Promise<SessionRef> {
  if ("ref" in session) return session

  const schema = getSession(session.origin, storage)
  await schema?.normalize(new Data(session), more)

  return { ref: true, origin: session.origin }
}