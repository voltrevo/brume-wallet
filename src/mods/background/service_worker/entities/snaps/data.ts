export interface SnapData {
  readonly uuid: string
  readonly name: string
  readonly bytecode: string
}

export interface SignedSnapData extends SnapData {
  readonly signature: string
}

