import { Component, ReactNode } from "react"

export interface FallbackProps {
  error: unknown
}

export type Fallback =
  (props: FallbackProps) => JSX.Element

export interface CatcherProps {
  children: ReactNode
  fallback: Fallback
}

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