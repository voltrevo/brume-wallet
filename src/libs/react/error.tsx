import { ChildrenProps } from "@hazae41/xswr/dist/types/libs/react"
import { Component } from "react"
import { ErrorProps } from "./props/error"
import { FallbackProps } from "./props/fallback"

export type CatcherProps =
  & ChildrenProps
  & FallbackProps<ErrorProps>

export interface CatcherState {
  error?: unknown
}

export class Catcher extends Component<CatcherProps, CatcherState> {

  constructor(props: CatcherProps) {
    super(props)
    this.state = {}
  }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error(error, errorInfo)
  }

  render() {
    const { error } = this.state

    if (error)
      return <this.props.fallback error={error} />
    return this.props.children
  }
}