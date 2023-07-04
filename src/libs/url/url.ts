export function qurl(pathname: string, query: Record<string, string | undefined>) {
  const url = new URL(pathname, "https://nowhere")

  for (const [key, value] of Object.entries(query))
    if (value != null)
      url.searchParams.append(key, value)

  return `${url.pathname}${url.search}`
}