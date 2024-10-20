import { z } from "@hazae41/gardien";

export const RpcRequestGuard = z.record({
  jsonrpc: z.strong("2.0"),
  id: z.union([z.strong(null), z.number(), z.string()]),
  method: z.string(),
  params: z.optional(z.unknown())
} as const)

export const RpcErrorGuard = z.record({
  code: z.number(),
  message: z.string(),
  data: z.unknown()
})

export const RpcOkGuard = z.record({
  jsonrpc: z.strong("2.0"),
  id: z.union([z.strong(null), z.number(), z.string()]),
  result: z.omitable(z.unknown()),
} as const)

export const RpcErrGuard = z.record({
  jsonrpc: z.strong("2.0"),
  id: z.union([z.strong(null), z.number(), z.string()]),
  error: RpcErrorGuard
} as const)

export const RpcResponseGuard = z.union([RpcOkGuard, RpcErrGuard])

export const RpcMessageGuard = z.union([RpcRequestGuard, RpcResponseGuard])