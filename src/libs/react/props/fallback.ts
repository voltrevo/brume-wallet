export interface FallbackProps<P> {
  fallback(props: P): JSX.Element
}