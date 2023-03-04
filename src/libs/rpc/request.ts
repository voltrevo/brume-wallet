export interface RequestInit<P extends unknown[] = unknown[]> {
  readonly method: string,
  readonly params: P
}

export interface Request<P extends unknown[] = unknown[]> {
  readonly jsonrpc: "2.0"
  readonly id: number
  readonly method: string
  readonly params: P
}