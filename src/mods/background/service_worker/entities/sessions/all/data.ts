import { Optional } from "@hazae41/option"
import { Fetched, IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"
import { Session, getSessionRef } from "../data"

export function getSessions(storage: IDBStorage) {
  const normalizer = async (fetched: Optional<Fetched<Session[], never>>, more: NormalizerMore) =>
    fetched?.map(async sessions => await Promise.all(sessions.map(session => getSessionRef(session, storage, more))))

  return createQuerySchema<string, Session[], never>({ key: `sessions`, storage, normalizer })
}