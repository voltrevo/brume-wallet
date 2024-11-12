import { QueryStorage, SimpleQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { BlobbyQuery } from "./blobbys/data"
import { LinksQuery } from "./links/data"
import { MicrodescQuery } from "./microdescs/data"
import { OriginQuery } from "./origins/data"
import { SeedQuery } from "./seeds/data"
import { SettingsQuery } from "./settings/data"

export function routeOrThrow(cacheKey: string, storage: QueryStorage): SimpleQuery<any, any, any> {
  let query: Nullable<any> = null

  if (query = BlobbyQuery.route(cacheKey, storage))
    return query
  if (query = LinksQuery.route(cacheKey, storage))
    return query
  if (query = MicrodescQuery.route(cacheKey, storage))
    return query
  if (query = MicrodescQuery.All.route(cacheKey, storage))
    return query
  if (query = OriginQuery.route(cacheKey, storage))
    return query
  if (query = SeedQuery.route(cacheKey, storage))
    return query
  if (query = SeedQuery.All.route(cacheKey, storage))
    return query
  if (query = SettingsQuery.Logs.route(cacheKey, storage))
    return query
  if (query = SettingsQuery.Chain.route(cacheKey, storage))
    return query

  throw new Error("Unknown cache key")
}