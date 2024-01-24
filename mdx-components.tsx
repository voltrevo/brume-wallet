import { ChildrenProps } from "@/libs/react/props/children"
import type { MDXComponents } from 'mdx/types'

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: h1,
    h2: h2,
    h3: h3,
    ...components,
  }
}

function h1(props: ChildrenProps) {
  const { children } = props

  return <h1 className="text-3xl">
    {children}
  </h1>
}

function h2(props: ChildrenProps) {
  const { children } = props

  return <h2 className="text-2xl">
    {children}
  </h2>
}

function h3(props: ChildrenProps) {
  const { children } = props

  return <h3 className="text-xl">
    {children}
  </h3>
}