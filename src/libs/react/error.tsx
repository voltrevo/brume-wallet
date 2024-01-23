import { Nullable } from "@hazae41/option"
import { Component, useEffect, useState } from "react"
import { ChildrenProps } from "./props/children"
import { ErrorProps } from "./props/error"
import { FallbackProps } from "./props/fallback"

export type CatcherProps =
  & ChildrenProps
  & FallbackProps<ErrorProps>

export interface CatcherState {
  error?: Nullable<unknown>
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
    const { fallback: Fallback } = this.props

    if (error != null)
      return <Fallback error={error} />

    return this.props.children
  }
}

export function PromiseCatcher(props: ChildrenProps) {
  const { children } = props

  const [event, setEvent] = useState<PromiseRejectionEvent>()

  useEffect(() => {
    addEventListener("unhandledrejection", setEvent)
  }, [])

  if (event != null)
    throw event.reason

  return <>{children}</>
}