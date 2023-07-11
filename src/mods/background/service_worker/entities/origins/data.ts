import { Data, IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"

export type Origin =
  | OriginData
  | OriginRef

export interface OriginRef {
  ref: true
  origin: string
}

export interface OriginData {
  origin: string,
  title?: string
  icon?: string
  description?: string
}

export function getOrigin(origin: string, storage: IDBStorage) {
  return createQuerySchema<string, OriginData, never>({ key: `origins/v1/${origin}`, storage })
}

export async function getOriginRef(origin: Origin, storage: IDBStorage, more: NormalizerMore): Promise<OriginRef> {
  if ("ref" in origin) return origin

  const schema = getOrigin(origin.origin, storage)
  await schema?.normalize(new Data(origin), more)

  return { ref: true, origin: origin.origin }
}